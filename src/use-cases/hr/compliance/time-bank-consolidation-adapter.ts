/**
 * TimeBankConsolidationAdapter — Phase 06 / Plan 06-04
 *
 * Wrapper pragmático sobre TimeEntry + Overtime + Absence + ShiftAssignment +
 * Shift + TimeBank para produzir uma `MonthlyConsolidation` consumível pelo
 * folha-espelho renderer (PDF CLT).
 *
 * **Design goals (D-05 + RESEARCH §Folha Espelho Data Model):**
 *  - NÃO reescreve cálculo de HE/DSR — lê valores pré-calculados (TimeBank +
 *    Overtime aprovada) e deriva só o que falta (workedMinutes por dia a partir
 *    de pares IN/OUT).
 *  - Fallback gracioso: se faltarem dados (sem TimeBank, sem ShiftAssignment,
 *    sem TimeEntries), retorna estrutura válida com zerados + warnings em
 *    `dataQuality.warnings` em vez de lançar.
 *  - Sem acoplamento HTTP: ordem simples de repositórios injetados.
 *
 * **Fonte de cálculos (ordem de preferência):**
 *  1. Overtime.approved[] — soma `hours * 60` diretamente em `overtime.at50Minutes`
 *     (v1 simplificado: todas as HEs aprovadas vão em 50%; separação 50/100 só
 *     quando o módulo timebank expuser a distinção — CCT-específico, fora do
 *     escopo MVP; registrado como warning).
 *  2. TimeBank.balance * 60 — saldo do ano (múltiplos do 60 para alinhar com
 *     unidade "minutos" do resto da consolidação).
 *  3. TimeEntry[] do mês — ordenados por timestamp; diff por pares consecutivos
 *     para cada dia (IN→OUT, IN→OUT aproximado). Robust ao caso de BREAK_START/
 *     BREAK_END (mesmo algoritmo, já que estamos pareando cronologicamente).
 *  4. Absence[] com overlap — dias marcados como VACATION/JUSTIFIED/
 *     UNJUSTIFIED.
 *
 * **Fallback sem ShiftAssignment:** sem jornada prevista conhecida, assumimos
 * "dia útil = 8h" e "DSR = domingo se sem faltas injustificadas na semana".
 * Warning claro no dataQuality para que o RH saiba.
 *
 * **Unidades:** todos os minutos (number). O renderer formata em HH:mm.
 */

import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as UEID } from '@/entities/domain/unique-entity-id';
import type { AbsencesRepository } from '@/repositories/hr/absences-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { OvertimeRepository } from '@/repositories/hr/overtime-repository';
import type { ShiftAssignmentsRepository } from '@/repositories/hr/shift-assignments-repository';
import type { ShiftsRepository } from '@/repositories/hr/shifts-repository';
import type { TimeBankRepository } from '@/repositories/hr/time-bank-repository';
import type { TimeEntriesRepository } from '@/repositories/hr/time-entries-repository';

export type DayOfWeekPt = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb';

const DAY_OF_WEEK_PT: readonly DayOfWeekPt[] = [
  'Dom',
  'Seg',
  'Ter',
  'Qua',
  'Qui',
  'Sex',
  'Sáb',
];

export interface DailyEntry {
  /** YYYY-MM-DD (UTC) */
  date: string;
  dayOfWeek: DayOfWeekPt;
  /** 'HH:MM' ou null se não houver shift ativo */
  scheduledStart: string | null;
  scheduledEnd: string | null;
  /** Horários (HH:MM) das batidas do dia, ordenados */
  entries: string[];
  workedMinutes: number;
  overtime50Minutes: number;
  overtime100Minutes: number;
  dsr: boolean;
  absenceType: 'UNJUSTIFIED' | 'JUSTIFIED' | 'VACATION' | null;
  /** Descrição livre (ex: "Atestado médico", "DSR", "Férias") */
  note: string;
}

export interface MonthlyConsolidation {
  employeeId: string;
  /** YYYY-MM */
  competencia: string;
  workedMinutes: number;
  scheduledMinutes: number;
  overtime: {
    at50Minutes: number;
    at100Minutes: number;
  };
  dsrMinutes: number;
  unjustifiedAbsenceDays: number;
  justifiedAbsenceDays: number;
  vacationDays: number;
  timeBankBalanceMinutes: number;
  dailyEntries: DailyEntry[];
  dataQuality: {
    hasTimeEntries: boolean;
    hasShiftAssignment: boolean;
    hasWorkSchedule: boolean;
    warnings: string[];
  };
}

const DEFAULT_WORKDAY_MINUTES = 8 * 60; // 8h fallback
const DSR_MINUTES_PER_WEEK = 8 * 60; // 1 dia/semana de DSR = 8h (CLT Art. 6º convenção)
const JUSTIFIED_ABSENCE_TYPES = new Set([
  'SICK_LEAVE',
  'PERSONAL_LEAVE',
  'MATERNITY_LEAVE',
  'PATERNITY_LEAVE',
  'BEREAVEMENT_LEAVE',
  'WEDDING_LEAVE',
  'MEDICAL_APPOINTMENT',
  'JURY_DUTY',
  'BLOOD_DONATION',
  'ELECTORAL_REGISTRATION',
  'MILITARY_SERVICE',
  'VESTIBULAR_EXAM',
  'CHILD_MEDICAL',
  'PRENATAL_COMPANION',
  'CANCER_SCREENING',
  'WORK_ACCIDENT',
]);

function parseCompetencia(competencia: string): {
  year: number;
  month: number;
} {
  const match = /^(\d{4})-(\d{2})$/.exec(competencia);
  if (!match) {
    throw new Error(
      `competencia inválida: "${competencia}" — use formato YYYY-MM`,
    );
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    throw new Error(
      `competencia inválida (mês fora de 01..12): ${competencia}`,
    );
  }
  return { year, month };
}

function daysInMonth(year: number, month: number): number {
  // Construímos a partir do primeiro dia do mês seguinte e subtraímos um dia
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatHm(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function timeStringToMinutes(hhmm: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Adapter principal — consolida dados do mês para 1 funcionário/tenant.
 *
 * Repositórios são TODOS injetados para permitir testes in-memory sem tocar
 * em Prisma. O use case `GenerateFolhaEspelhoUseCase` (Task 2) cria a
 * instância via factory.
 */
export class TimeBankConsolidationAdapter {
  constructor(
    private readonly timeEntryRepo: TimeEntriesRepository,
    private readonly overtimeRepo: OvertimeRepository,
    private readonly absenceRepo: AbsencesRepository,
    private readonly shiftAssignmentRepo: ShiftAssignmentsRepository,
    private readonly shiftsRepo: ShiftsRepository,
    private readonly timeBankRepo: TimeBankRepository,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly _employeeRepo: EmployeesRepository,
  ) {}

  /**
   * Produz a consolidação mensal para um funcionário + competência.
   *
   * Fallback gracioso em todos os pontos: warnings populados em vez de throw
   * quando dados faltam. O renderer PDF exibe os warnings em uma seção
   * "Observações" discreta para o RH/auditor saber.
   */
  async getByEmployeeAndPeriod(
    employeeId: string,
    competencia: string,
    tenantId: string,
  ): Promise<MonthlyConsolidation> {
    const { year, month } = parseCompetencia(competencia);
    const warnings: string[] = [];

    // ── 1. Range do mês (UTC, inclusivo em ambos lados) ────────────────
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(
      Date.UTC(year, month - 1, daysInMonth(year, month), 23, 59, 59),
    );
    const employeeUid: UniqueEntityID = new UEID(employeeId);

    // ── 2. TimeEntry[] do funcionário no range ─────────────────────────
    const timeEntriesResult =
      await this.timeEntryRepo.findManyByEmployeeAndDateRange(
        employeeUid,
        startOfMonth,
        endOfMonth,
        tenantId,
      );
    // `findManyByEmployeeAndDateRange` retorna TimeEntry[] (já ordenado pela
    // implementação Prisma; in-memory ignora ordem — ordenamos local).
    const timeEntries = [...timeEntriesResult].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    const hasTimeEntries = timeEntries.length > 0;
    if (!hasTimeEntries) {
      warnings.push('Nenhuma batida encontrada no período.');
    }

    // ── 3. ShiftAssignment ativo + Shift para jornada prevista ─────────
    let hasShiftAssignment = false;
    let scheduledStartHm: string | null = null;
    let scheduledEndHm: string | null = null;
    let dailyShiftMinutes = DEFAULT_WORKDAY_MINUTES;
    try {
      const assignment = await this.shiftAssignmentRepo.findActiveByEmployee(
        employeeId,
        tenantId,
      );
      if (assignment) {
        hasShiftAssignment = true;
        const shift = await this.shiftsRepo.findById(
          assignment.shiftId,
          tenantId,
        );
        if (shift) {
          scheduledStartHm = shift.startTime;
          scheduledEndHm = shift.endTime;
          const startMin = timeStringToMinutes(shift.startTime);
          const endMin = timeStringToMinutes(shift.endTime);
          const gross =
            endMin >= startMin ? endMin - startMin : endMin + 1440 - startMin;
          dailyShiftMinutes = Math.max(0, gross - shift.breakMinutes);
        } else {
          warnings.push(
            'Shift do funcionário não encontrado — usando jornada padrão de 8h.',
          );
        }
      } else {
        warnings.push(
          'Funcionário sem ShiftAssignment ativo — usando jornada padrão de 8h e DSR aos domingos.',
        );
      }
    } catch {
      // Defensivo: algum repo customizado pode throwar em tenant mismatch
      // — tratamos como "sem shift".
      warnings.push('Erro ao consultar jornada — usando jornada padrão de 8h.');
    }

    // Não há entity WorkSchedule materializada no codebase como "WorkSchedule";
    // o conceito é operacionalizado via ShiftAssignment+Shift (ADR-004 HR).
    // Mantemos o flag para consistência com o shape documentado e warning se
    // faltar.
    const hasWorkSchedule = hasShiftAssignment;

    // ── 4. Overtime[] aprovada no range ────────────────────────────────
    let overtime50Minutes = 0;
    const overtime100Minutes = 0; // v1: não separa 50/100 (ver docstring)
    try {
      const overtimes = await this.overtimeRepo.findManyByEmployeeAndDateRange(
        employeeUid,
        startOfMonth,
        endOfMonth,
        tenantId,
      );
      for (const ot of overtimes) {
        if (ot.approved) {
          overtime50Minutes += Math.round(ot.hours * 60);
        }
      }
      if (overtimes.length > 0) {
        warnings.push(
          'Hora extra 50/100 não distinguida nesta versão — totais agregados em HE 50%.',
        );
      }
    } catch {
      warnings.push('Erro ao consultar horas extras.');
    }

    // ── 5. Absence[] com overlap ao range ──────────────────────────────
    let absences: Array<{
      type: string;
      startDate: Date;
      endDate: Date;
    }> = [];
    try {
      const absenceList = await this.absenceRepo.findManyByEmployeeAndDateRange(
        employeeUid,
        startOfMonth,
        endOfMonth,
        tenantId,
      );
      absences = absenceList
        .filter((a) => a.isApproved() || a.isInProgress() || a.isCompleted())
        .map((a) => ({
          type: a.type.value,
          startDate: a.startDate,
          endDate: a.endDate,
        }));
    } catch {
      warnings.push('Erro ao consultar ausências.');
    }

    // ── 6. TimeBank.balance (saldo do ano) ─────────────────────────────
    let timeBankBalanceMinutes = 0;
    try {
      const bank = await this.timeBankRepo.findByEmployeeAndYear(
        employeeUid,
        year,
        tenantId,
      );
      if (bank) {
        timeBankBalanceMinutes = Math.round(bank.balance * 60);
      } else {
        warnings.push('Saldo do banco de horas não disponível para o ano.');
      }
    } catch {
      warnings.push('Erro ao consultar banco de horas.');
    }

    // ── 7. Construção dos DailyEntry[] iterando dia a dia ──────────────
    const totalDays = daysInMonth(year, month);
    const dailyEntries: DailyEntry[] = [];

    // Índice auxiliar: entries por YYYY-MM-DD
    const entriesByDay = new Map<string, typeof timeEntries>();
    for (const te of timeEntries) {
      const key = formatYmd(te.timestamp);
      const bucket = entriesByDay.get(key);
      if (bucket) {
        bucket.push(te);
      } else {
        entriesByDay.set(key, [te]);
      }
    }

    let workedMinutes = 0;
    let scheduledMinutes = 0;
    let unjustifiedAbsenceDays = 0;
    let justifiedAbsenceDays = 0;
    let vacationDays = 0;
    let dsrMinutes = 0;

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(Date.UTC(year, month - 1, day));
      const ymd = formatYmd(date);
      const dow = DAY_OF_WEEK_PT[date.getUTCDay()];

      const dayEntries = entriesByDay.get(ymd) ?? [];
      const entriesHm = dayEntries.map((e) => formatHm(e.timestamp));

      // Derivar workedMinutes do dia por pares consecutivos
      let dayWorked = 0;
      if (dayEntries.length >= 2) {
        const sorted = [...dayEntries].sort(
          (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
        );
        for (let i = 0; i + 1 < sorted.length; i += 2) {
          const inT = sorted[i].timestamp.getTime();
          const outT = sorted[i + 1].timestamp.getTime();
          if (outT > inT) {
            dayWorked += Math.round((outT - inT) / 60000);
          }
        }
      }

      // Absence detection (type + flags)
      let absenceType: 'UNJUSTIFIED' | 'JUSTIFIED' | 'VACATION' | null = null;
      let noteText = '';
      for (const ab of absences) {
        if (date >= stripTime(ab.startDate) && date <= stripTime(ab.endDate)) {
          if (ab.type === 'VACATION') {
            absenceType = 'VACATION';
            noteText = 'Férias';
          } else if (JUSTIFIED_ABSENCE_TYPES.has(ab.type)) {
            absenceType = 'JUSTIFIED';
            noteText = absenceLabelPt(ab.type);
          } else {
            absenceType = 'UNJUSTIFIED';
            noteText = 'Falta';
          }
          break;
        }
      }

      // DSR detection: simplificação MVP — domingo é DSR (sem faltas
      // injustificadas no domingo que atrapalhariam o direito).
      const isSunday = date.getUTCDay() === 0;
      const isDsrDay = isSunday && absenceType !== 'UNJUSTIFIED';

      // Jornada prevista: dias úteis (seg a sex por padrão). Se houver shift,
      // confiamos na jornada total do shift aplicada seg-sex (simplificação —
      // Shift.daysOfWeek detalhado não está no schema).
      const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
      const scheduledMinutesForDay = isWeekend ? 0 : dailyShiftMinutes;

      if (isDsrDay) {
        dsrMinutes += DSR_MINUTES_PER_WEEK / 7; // distribui igualmente; total batalhará com soma semanal
        if (!noteText) {
          noteText = 'DSR';
        }
      }

      if (absenceType === 'VACATION') {
        vacationDays++;
      } else if (absenceType === 'JUSTIFIED') {
        justifiedAbsenceDays++;
      } else if (absenceType === 'UNJUSTIFIED') {
        unjustifiedAbsenceDays++;
      }

      scheduledMinutes += scheduledMinutesForDay;
      workedMinutes += dayWorked;

      dailyEntries.push({
        date: ymd,
        dayOfWeek: dow,
        scheduledStart: isWeekend ? null : scheduledStartHm,
        scheduledEnd: isWeekend ? null : scheduledEndHm,
        entries: entriesHm,
        workedMinutes: dayWorked,
        overtime50Minutes: 0, // o total consolidado vai no rodapé; por-dia é fallback vazio em v1
        overtime100Minutes: 0,
        dsr: isDsrDay,
        absenceType,
        note: noteText,
      });
    }

    // DSR mínimo simplificado: 4 domingos * 8h (1 dia/semana padrão CLT)
    // quando não há faltas injustificadas detectadas. Ajustamos para inteiro
    // em minutos porque somamos frações no loop.
    dsrMinutes = Math.round(dsrMinutes);

    if (!hasTimeEntries) {
      // Entries zerados; mas DSR/agendado ainda contam em warnings
      // (documentação CLT Art. 6º mencionada).
      warnings.push(
        'DSR calculado com regra padrão CLT (1 dia/semana); tenant pode diferir em CCT.',
      );
    }

    return {
      employeeId,
      competencia,
      workedMinutes,
      scheduledMinutes,
      overtime: {
        at50Minutes: overtime50Minutes,
        at100Minutes: overtime100Minutes,
      },
      dsrMinutes,
      unjustifiedAbsenceDays,
      justifiedAbsenceDays,
      vacationDays,
      timeBankBalanceMinutes,
      dailyEntries,
      dataQuality: {
        hasTimeEntries,
        hasShiftAssignment,
        hasWorkSchedule,
        warnings,
      },
    };
  }
}

/**
 * Normaliza Date → data (sem hora) no UTC. Evita comparações incorretas
 * quando `startDate/endDate` de Absence têm TZ diferente.
 */
function stripTime(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function absenceLabelPt(type: string): string {
  switch (type) {
    case 'SICK_LEAVE':
      return 'Atestado médico';
    case 'PERSONAL_LEAVE':
      return 'Licença pessoal';
    case 'MATERNITY_LEAVE':
      return 'Licença maternidade';
    case 'PATERNITY_LEAVE':
      return 'Licença paternidade';
    case 'BEREAVEMENT_LEAVE':
      return 'Luto';
    case 'WEDDING_LEAVE':
      return 'Casamento';
    case 'MEDICAL_APPOINTMENT':
      return 'Consulta médica';
    case 'JURY_DUTY':
      return 'Júri';
    case 'BLOOD_DONATION':
      return 'Doação sangue';
    case 'ELECTORAL_REGISTRATION':
      return 'Alistamento eleitoral';
    case 'MILITARY_SERVICE':
      return 'Serviço militar';
    case 'VESTIBULAR_EXAM':
      return 'Vestibular';
    case 'CHILD_MEDICAL':
      return 'Acompanhamento médico filho';
    case 'PRENATAL_COMPANION':
      return 'Acompanhamento pré-natal';
    case 'CANCER_SCREENING':
      return 'Exame preventivo';
    case 'WORK_ACCIDENT':
      return 'Acidente de trabalho';
    default:
      return 'Abono';
  }
}
