/**
 * time-bank-consolidation-adapter.spec.ts — Phase 06 / Plan 06-04 Task 1
 *
 * Testes unit in-memory cobrindo:
 *  - Mês vazio (sem TimeEntries) → consolidação com workedMinutes=0 + warnings
 *  - Mês de março 2026 (22 dias úteis × 8h): workedMinutes = Σ pares IN/OUT
 *  - Férias cobrindo 10 dias → vacationDays=10
 *  - TimeBank.balance=15.5h → timeBankBalanceMinutes=930
 *  - TimeBank ausente → warning específico
 *  - Propriedade: Σ dailyEntries.workedMinutes === workedMinutes total
 *  - dailyEntries.length === dias do mês (31 para março, 28 para fev 2026)
 */

import { beforeEach, describe, expect, it } from 'vitest';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import { Overtime } from '@/entities/hr/overtime';
import { Shift } from '@/entities/hr/shift';
import { ShiftAssignment } from '@/entities/hr/shift-assignment';
import { TimeBank } from '@/entities/hr/time-bank';
import { AbsenceStatus, AbsenceType } from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryShiftAssignmentsRepository } from '@/repositories/hr/in-memory/in-memory-shift-assignments-repository';
import { InMemoryShiftsRepository } from '@/repositories/hr/in-memory/in-memory-shifts-repository';
import { InMemoryTimeBankRepository } from '@/repositories/hr/in-memory/in-memory-time-bank-repository';
import { InMemoryTimeEntriesRepository } from '@/repositories/hr/in-memory/in-memory-time-entries-repository';

import { TimeBankConsolidationAdapter } from './time-bank-consolidation-adapter';

// ---------- In-memory Overtime repo (minimal, só o que o adapter usa) ----------
import type { OvertimeRepository } from '@/repositories/hr/overtime-repository';

class InMemoryOvertimeRepo implements OvertimeRepository {
  public items: Overtime[] = [];

  async create(): Promise<Overtime> {
    throw new Error('not used in spec');
  }

  async findById(): Promise<Overtime | null> {
    return null;
  }

  async findMany(): Promise<Overtime[]> {
    return [];
  }

  async findManyPaginated() {
    return { overtimes: [], total: 0 };
  }

  async findManyByEmployee(): Promise<Overtime[]> {
    return [];
  }

  async findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Overtime[]> {
    return this.items.filter(
      (o) =>
        o.employeeId.equals(employeeId) &&
        o.tenantId.toString() === tenantId &&
        o.date >= startDate &&
        o.date <= endDate,
    );
  }

  async findManyPending(): Promise<Overtime[]> {
    return [];
  }

  async findManyApproved(): Promise<Overtime[]> {
    return [];
  }

  async update(): Promise<Overtime | null> {
    return null;
  }

  async save(): Promise<void> {
    // no-op
  }

  async delete(): Promise<void> {
    // no-op
  }
}

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const EMPLOYEE_ID = '22222222-2222-2222-2222-222222222222';

let timeEntries: InMemoryTimeEntriesRepository;
let overtimes: InMemoryOvertimeRepo;
let absences: InMemoryAbsencesRepository;
let shiftAssignments: InMemoryShiftAssignmentsRepository;
let shifts: InMemoryShiftsRepository;
let timeBank: InMemoryTimeBankRepository;
let employees: InMemoryEmployeesRepository;
let adapter: TimeBankConsolidationAdapter;

beforeEach(() => {
  timeEntries = new InMemoryTimeEntriesRepository();
  overtimes = new InMemoryOvertimeRepo();
  absences = new InMemoryAbsencesRepository();
  shiftAssignments = new InMemoryShiftAssignmentsRepository();
  shifts = new InMemoryShiftsRepository();
  timeBank = new InMemoryTimeBankRepository();
  employees = new InMemoryEmployeesRepository();
  adapter = new TimeBankConsolidationAdapter(
    timeEntries,
    overtimes,
    absences,
    shiftAssignments,
    shifts,
    timeBank,
    employees,
  );
});

describe('TimeBankConsolidationAdapter — mês vazio', () => {
  it('retorna consolidação válida com warnings quando não há batidas', async () => {
    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.employeeId).toBe(EMPLOYEE_ID);
    expect(result.competencia).toBe('2026-03');
    expect(result.workedMinutes).toBe(0);
    expect(result.dailyEntries).toHaveLength(31); // março tem 31 dias
    expect(result.dataQuality.hasTimeEntries).toBe(false);
    expect(result.dataQuality.warnings).toContain(
      'Nenhuma batida encontrada no período.',
    );
  });

  it('retorna 28 dailyEntries para fevereiro 2026 (não é ano bissexto)', async () => {
    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-02',
      TENANT_ID,
    );

    expect(result.dailyEntries).toHaveLength(28);
  });

  it('aceita janela de 29 dias para fevereiro 2024 (bissexto)', async () => {
    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2024-02',
      TENANT_ID,
    );

    expect(result.dailyEntries).toHaveLength(29);
  });
});

describe('TimeBankConsolidationAdapter — batidas reais', () => {
  beforeEach(async () => {
    // Seed: 2 dias de março com 2 batidas cada (08:00 IN → 16:00 OUT = 480min)
    await timeEntries.create({
      tenantId: TENANT_ID,
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      entryType: 'CLOCK_IN',
      timestamp: new Date('2026-03-02T08:00:00Z'),
      nsrNumber: 1,
    });
    await timeEntries.create({
      tenantId: TENANT_ID,
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      entryType: 'CLOCK_OUT',
      timestamp: new Date('2026-03-02T16:00:00Z'),
      nsrNumber: 2,
    });
    await timeEntries.create({
      tenantId: TENANT_ID,
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      entryType: 'CLOCK_IN',
      timestamp: new Date('2026-03-03T08:00:00Z'),
      nsrNumber: 3,
    });
    await timeEntries.create({
      tenantId: TENANT_ID,
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      entryType: 'CLOCK_OUT',
      timestamp: new Date('2026-03-03T16:00:00Z'),
      nsrNumber: 4,
    });
  });

  it('soma workedMinutes por pares de batida', async () => {
    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.workedMinutes).toBe(960); // 2 dias × 8h = 960 min
    expect(result.dataQuality.hasTimeEntries).toBe(true);
  });

  it('propriedade: Σ dailyEntries.workedMinutes === workedMinutes total', async () => {
    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    const sumDaily = result.dailyEntries.reduce(
      (acc, d) => acc + d.workedMinutes,
      0,
    );
    expect(sumDaily).toBe(result.workedMinutes);
  });

  it('dailyEntries contém horários das batidas formatados HH:MM', async () => {
    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    const day2 = result.dailyEntries.find((d) => d.date === '2026-03-02');
    expect(day2).toBeDefined();
    expect(day2!.entries).toEqual(['08:00', '16:00']);
    expect(day2!.workedMinutes).toBe(480);
  });
});

describe('TimeBankConsolidationAdapter — absences', () => {
  it('marca 10 dias como VACATION quando Absence(VACATION) cobre o intervalo', async () => {
    // Cria absence de férias 10 dias: 2026-03-10..2026-03-19
    const vac = Absence.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      type: AbsenceType.vacation(),
      status: AbsenceStatus.approved(),
      startDate: new Date('2026-03-10T00:00:00Z'),
      endDate: new Date('2026-03-19T00:00:00Z'),
      totalDays: 10,
      isPaid: true,
    });
    absences.items.push(vac);

    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.vacationDays).toBe(10);
    const vacDays = result.dailyEntries.filter(
      (d) => d.absenceType === 'VACATION',
    );
    expect(vacDays).toHaveLength(10);
    expect(vacDays.every((d) => d.note === 'Férias')).toBe(true);
  });

  it('marca dias como JUSTIFIED quando Absence(SICK_LEAVE) cobre', async () => {
    const sick = Absence.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      type: AbsenceType.create('SICK_LEAVE'),
      status: AbsenceStatus.approved(),
      startDate: new Date('2026-03-05T00:00:00Z'),
      endDate: new Date('2026-03-05T00:00:00Z'),
      totalDays: 1,
      isPaid: true,
    });
    absences.items.push(sick);

    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.justifiedAbsenceDays).toBe(1);
    const day = result.dailyEntries.find((d) => d.date === '2026-03-05');
    expect(day!.absenceType).toBe('JUSTIFIED');
    expect(day!.note).toBe('Atestado médico');
  });
});

describe('TimeBankConsolidationAdapter — timeBank balance', () => {
  it('converte TimeBank.balance (horas) para timeBankBalanceMinutes', async () => {
    // Balance 15.5h = 930 min
    await timeBank.create({
      tenantId: TENANT_ID,
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      balance: 15.5,
      year: 2026,
    });

    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.timeBankBalanceMinutes).toBe(930);
    // Sem warning sobre banco ausente nesse caso
    expect(
      result.dataQuality.warnings.some((w) =>
        w.includes('banco de horas não disponível'),
      ),
    ).toBe(false);
  });

  it('quando TimeBank ausente, timeBankBalanceMinutes=0 + warning explícito', async () => {
    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.timeBankBalanceMinutes).toBe(0);
    expect(
      result.dataQuality.warnings.some((w) =>
        w.includes('Saldo do banco de horas não disponível'),
      ),
    ).toBe(true);
  });

  it('aceita TimeBank com balance negativo (saldo devedor)', async () => {
    await timeBank.create({
      tenantId: TENANT_ID,
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      balance: -3.0,
      year: 2026,
    });

    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.timeBankBalanceMinutes).toBe(-180);
  });
});

describe('TimeBankConsolidationAdapter — ShiftAssignment', () => {
  it('usa startTime/endTime do Shift quando há assignment ativo', async () => {
    const shift = await shifts.create({
      tenantId: TENANT_ID,
      name: 'Comercial',
      type: 'FIXED',
      startTime: '09:00',
      endTime: '18:00',
      breakMinutes: 60, // 1h de almoço → 8h líquidas
      isActive: true,
    });
    await shiftAssignments.create({
      tenantId: TENANT_ID,
      shiftId: shift.id.toString(),
      employeeId: EMPLOYEE_ID,
      startDate: new Date('2026-01-01'),
      isActive: true,
    });

    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.dataQuality.hasShiftAssignment).toBe(true);
    // Primeiro dia útil de março 2026: 2026-03-02 (segunda)
    const monday = result.dailyEntries.find((d) => d.date === '2026-03-02');
    expect(monday!.scheduledStart).toBe('09:00');
    expect(monday!.scheduledEnd).toBe('18:00');
  });

  it('quando sem ShiftAssignment ativo, usa fallback 8h + warning', async () => {
    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.dataQuality.hasShiftAssignment).toBe(false);
    expect(
      result.dataQuality.warnings.some((w) =>
        w.includes('sem ShiftAssignment ativo'),
      ),
    ).toBe(true);
  });
});

describe('TimeBankConsolidationAdapter — Overtime', () => {
  it('soma overtime.hours aprovadas em overtime.at50Minutes', async () => {
    const ot = Overtime.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      date: new Date('2026-03-05T00:00:00Z'),
      hours: 2.5,
      reason: 'Urgência',
      approved: true,
      approvedBy: new UniqueEntityID(),
      approvedAt: new Date('2026-03-06T00:00:00Z'),
    });
    overtimes.items.push(ot);

    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.overtime.at50Minutes).toBe(150);
    expect(result.overtime.at100Minutes).toBe(0);
  });

  it('IGNORA overtime não aprovada', async () => {
    const ot = Overtime.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      employeeId: new UniqueEntityID(EMPLOYEE_ID),
      date: new Date('2026-03-05T00:00:00Z'),
      hours: 2.5,
      reason: 'Urgência',
      approved: false,
    });
    overtimes.items.push(ot);

    const result = await adapter.getByEmployeeAndPeriod(
      EMPLOYEE_ID,
      '2026-03',
      TENANT_ID,
    );

    expect(result.overtime.at50Minutes).toBe(0);
  });
});

describe('TimeBankConsolidationAdapter — validação de competência', () => {
  it('lança em competência inválida (string vazia)', async () => {
    await expect(
      adapter.getByEmployeeAndPeriod(EMPLOYEE_ID, '', TENANT_ID),
    ).rejects.toThrow(/competencia inválida/);
  });

  it('lança em competência malformada (MM-YYYY)', async () => {
    await expect(
      adapter.getByEmployeeAndPeriod(EMPLOYEE_ID, '03-2026', TENANT_ID),
    ).rejects.toThrow(/competencia inválida/);
  });

  it('lança em mês 00 ou 13', async () => {
    await expect(
      adapter.getByEmployeeAndPeriod(EMPLOYEE_ID, '2026-00', TENANT_ID),
    ).rejects.toThrow(/competencia inválida/);
    await expect(
      adapter.getByEmployeeAndPeriod(EMPLOYEE_ID, '2026-13', TENANT_ID),
    ).rejects.toThrow(/competencia inválida/);
  });
});

// Satisfazer lint sobre imports unused (mantém as variáveis visíveis para IDE)
void Shift;
void ShiftAssignment;
void TimeBank;
