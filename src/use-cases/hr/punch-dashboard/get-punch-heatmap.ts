/**
 * GetPunchHeatmapUseCase — Phase 07 / Plan 07-05b (Wave 3).
 *
 * Pure read-side use case que materializa o heatmap funcionário×dia×status6
 * consumido pelo dashboard do gestor.
 *
 * Contract:
 *   execute({ tenantId, month: 'YYYY-MM', employeeIds? }) → {
 *     rows: HeatmapRow[],          // 1 por employee (scoped)
 *     columns: HeatmapColumn[],    // 1 por dia do mês (28..31)
 *     cells: HeatmapCell[],        // rows × columns
 *   }
 *
 * Status priority (primary):
 *   JUSTIFICADO > EXCEÇÃO > FALTA > ATRASO > NORMAL
 *
 * HORA_EXTRA é secondary — stack com primary quando há batidas fora do shift
 * window (antes de startTime ou depois de endTime).
 *
 * Implementação usa shape mínimo Prisma (HeatmapPrisma) — 5 findMany no total
 * (employees, timeEntries, approvals, vacations, shifts) com `where.tenantId`
 * em todas. Specs mockam o shape inteiro sem precisar do PrismaClient real.
 */

const TOLERANCE_MINUTES_DEFAULT = 10;

export type HeatmapStatus =
  | 'NORMAL'
  | 'ATRASO'
  | 'FALTA'
  | 'EXCEÇÃO'
  | 'JUSTIFICADO'
  | 'HORA_EXTRA';

export interface HeatmapRow {
  id: string;
  label: string;
  subLabel?: string;
}

export interface HeatmapColumn {
  id: string; // 'YYYY-MM-DD'
  label: string; // Day-of-month string ('01'..'31')
  isWeekend?: boolean;
  isHoliday?: boolean;
}

export interface HeatmapCell {
  rowId: string;
  colId: string;
  statuses: HeatmapStatus[];
  tooltip?: string;
  payload?: {
    employeeId: string;
    date: string;
    timeEntryIds?: string[];
    approvalId?: string;
  };
}

export interface PunchHeatmapResponse {
  rows: HeatmapRow[];
  columns: HeatmapColumn[];
  cells: HeatmapCell[];
}

export interface GetPunchHeatmapInput {
  tenantId: string;
  month: string; // 'YYYY-MM'
  employeeIds?: string[];
}

/**
 * Shape mínimo Prisma necessário pelo use case. Pattern consistente com
 * 07-05a (DailyDigestPrisma, HeartbeatPrisma) — específico do consumo,
 * sem importar o PrismaClient real, permite specs com mock minúsculo.
 */
export interface HeatmapPrisma {
  employee: {
    findMany(args: {
      where: {
        tenantId: string;
        deletedAt?: null;
        id?: { in: string[] };
      };
      select?: Record<string, unknown>;
      orderBy?: Record<string, unknown>;
    }): Promise<
      Array<{
        id: string;
        fullName: string;
        socialName: string | null;
        registrationNumber: string;
        departmentId: string | null;
        department: { name: string } | null;
      }>
    >;
  };
  timeEntry: {
    findMany(args: {
      where: {
        tenantId: string;
        employeeId: { in: string[] };
        timestamp: { gte: Date; lte: Date };
      };
    }): Promise<
      Array<{
        id: string;
        employeeId: string;
        timestamp: Date;
        entryType: string;
      }>
    >;
  };
  punchApproval: {
    findMany(args: {
      where: {
        tenantId: string;
        employeeId: { in: string[] };
        status: { in: string[] };
      };
    }): Promise<
      Array<{
        id: string;
        employeeId: string;
        status: string;
        createdAt: Date;
        timeEntry: { timestamp: Date } | null;
      }>
    >;
  };
  vacationPeriod: {
    findMany(args: {
      where: {
        tenantId: string;
        employeeId: { in: string[] };
        status: { in: string[] };
      };
    }): Promise<
      Array<{
        id: string;
        employeeId: string;
        status: string;
        scheduledStart: Date | null;
        scheduledEnd: Date | null;
      }>
    >;
  };
  shiftAssignment: {
    findMany(args: {
      where: {
        tenantId: string;
        employeeId: { in: string[] };
        isActive: boolean;
      };
    }): Promise<
      Array<{
        id: string;
        employeeId: string;
        startDate: Date;
        endDate: Date | null;
        isActive: boolean;
        shift: { startTime: string; endTime: string };
      }>
    >;
  };
}

function parseMonth(month: string): { year: number; monthIdx: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    throw new Error(`Invalid month format: ${month}; expected YYYY-MM`);
  }
  const year = Number.parseInt(match[1], 10);
  const monthIdx = Number.parseInt(match[2], 10) - 1; // Date months are 0-indexed
  return { year, monthIdx };
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function dayKey(year: number, monthIdx: number, day: number): string {
  return `${year}-${pad2(monthIdx + 1)}-${pad2(day)}`;
}

function daysInMonth(year: number, monthIdx: number): number {
  return new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
}

function isWeekendUTC(year: number, monthIdx: number, day: number): boolean {
  const dow = new Date(Date.UTC(year, monthIdx, day)).getUTCDay();
  return dow === 0 || dow === 6;
}

/**
 * Converte 'HH:MM' (UTC) num offset em minutos desde meio-noite UTC do dia.
 */
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((v) => Number.parseInt(v, 10));
  return h * 60 + m;
}

/**
 * Retorna o offset em minutos desde a meia-noite UTC do dia da batida.
 */
function minutesFromMidnightUTC(timestamp: Date): number {
  return timestamp.getUTCHours() * 60 + timestamp.getUTCMinutes();
}

export class GetPunchHeatmapUseCase {
  constructor(
    private prisma: HeatmapPrisma,
    private toleranceMinutes: number = TOLERANCE_MINUTES_DEFAULT,
  ) {}

  async execute(input: GetPunchHeatmapInput): Promise<PunchHeatmapResponse> {
    const { tenantId, month, employeeIds } = input;
    const { year, monthIdx } = parseMonth(month);
    const totalDays = daysInMonth(year, monthIdx);
    const startDate = new Date(Date.UTC(year, monthIdx, 1));
    const endDate = new Date(
      Date.UTC(year, monthIdx, totalDays, 23, 59, 59, 999),
    );

    // 1. Fetch employees (scoped if employeeIds provided)
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(employeeIds && employeeIds.length > 0
          ? { id: { in: employeeIds } }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        socialName: true,
        registrationNumber: true,
        departmentId: true,
        department: { select: { name: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    if (employees.length === 0) {
      return {
        rows: [],
        columns: this.buildColumns(year, monthIdx, totalDays),
        cells: [],
      };
    }

    const allEmployeeIds = employees.map((e) => e.id);

    // 2. Fetch time entries, approvals, vacations, shifts in parallel.
    const [timeEntries, approvals, vacations, shiftAssignments] =
      await Promise.all([
        this.prisma.timeEntry.findMany({
          where: {
            tenantId,
            employeeId: { in: allEmployeeIds },
            timestamp: { gte: startDate, lte: endDate },
          },
        }),
        this.prisma.punchApproval.findMany({
          where: {
            tenantId,
            employeeId: { in: allEmployeeIds },
            status: { in: ['PENDING', 'APPROVED', 'REJECTED'] },
          },
        }),
        this.prisma.vacationPeriod.findMany({
          where: {
            tenantId,
            employeeId: { in: allEmployeeIds },
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          },
        }),
        this.prisma.shiftAssignment.findMany({
          where: {
            tenantId,
            employeeId: { in: allEmployeeIds },
            isActive: true,
          },
        }),
      ]);

    // 3. Build rows + columns
    const rows: HeatmapRow[] = employees.map((e) => ({
      id: e.id,
      label: e.socialName ?? e.fullName,
      subLabel: e.department?.name ?? e.registrationNumber,
    }));

    const columns = this.buildColumns(year, monthIdx, totalDays);

    // 4. Build cells with status priority logic
    const cells: HeatmapCell[] = [];
    for (const employee of employees) {
      for (let day = 1; day <= totalDays; day++) {
        const colId = dayKey(year, monthIdx, day);
        const dayStart = new Date(Date.UTC(year, monthIdx, day));
        const dayEnd = new Date(Date.UTC(year, monthIdx, day, 23, 59, 59, 999));

        const cellStatuses = this.computeCellStatuses({
          employeeId: employee.id,
          dayStart,
          dayEnd,
          timeEntries,
          approvals,
          vacations,
          shiftAssignments,
          isWeekend: isWeekendUTC(year, monthIdx, day),
        });

        const dayApprovals = approvals.filter(
          (a) =>
            a.employeeId === employee.id &&
            this.approvalCoversDay(a, dayStart, dayEnd),
        );
        const dayTimeEntries = timeEntries.filter(
          (te) =>
            te.employeeId === employee.id &&
            te.timestamp >= dayStart &&
            te.timestamp <= dayEnd,
        );

        const cell: HeatmapCell = {
          rowId: employee.id,
          colId,
          statuses: cellStatuses,
          payload: {
            employeeId: employee.id,
            date: colId,
            ...(dayTimeEntries.length > 0
              ? { timeEntryIds: dayTimeEntries.map((te) => te.id) }
              : {}),
            ...(dayApprovals[0] ? { approvalId: dayApprovals[0].id } : {}),
          },
        };
        cells.push(cell);
      }
    }

    return { rows, columns, cells };
  }

  private buildColumns(
    year: number,
    monthIdx: number,
    totalDays: number,
  ): HeatmapColumn[] {
    const cols: HeatmapColumn[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const isWeekend = isWeekendUTC(year, monthIdx, day);
      cols.push({
        id: dayKey(year, monthIdx, day),
        label: pad2(day),
        ...(isWeekend ? { isWeekend: true } : {}),
      });
    }
    return cols;
  }

  private approvalCoversDay(
    a: { createdAt: Date; timeEntry: { timestamp: Date } | null },
    dayStart: Date,
    dayEnd: Date,
  ): boolean {
    if (
      a.timeEntry &&
      a.timeEntry.timestamp >= dayStart &&
      a.timeEntry.timestamp <= dayEnd
    ) {
      return true;
    }
    return a.createdAt >= dayStart && a.createdAt <= dayEnd;
  }

  /**
   * Calcula `statuses` para um cell. Order: primary status calculado por
   * priority chain; HORA_EXTRA appended quando há batidas fora do shift
   * window.
   */
  private computeCellStatuses(args: {
    employeeId: string;
    dayStart: Date;
    dayEnd: Date;
    timeEntries: Array<{
      id: string;
      employeeId: string;
      timestamp: Date;
      entryType: string;
    }>;
    approvals: Array<{
      id: string;
      employeeId: string;
      status: string;
      createdAt: Date;
      timeEntry: { timestamp: Date } | null;
    }>;
    vacations: Array<{
      id: string;
      employeeId: string;
      status: string;
      scheduledStart: Date | null;
      scheduledEnd: Date | null;
    }>;
    shiftAssignments: Array<{
      id: string;
      employeeId: string;
      startDate: Date;
      endDate: Date | null;
      isActive: boolean;
      shift: { startTime: string; endTime: string };
    }>;
    isWeekend: boolean;
  }): HeatmapStatus[] {
    const {
      employeeId,
      dayStart,
      dayEnd,
      timeEntries,
      approvals,
      vacations,
      shiftAssignments,
      isWeekend,
    } = args;

    // Filter inputs to this employee+day
    const empTimeEntries = timeEntries.filter(
      (te) =>
        te.employeeId === employeeId &&
        te.timestamp >= dayStart &&
        te.timestamp <= dayEnd,
    );
    const empApprovals = approvals.filter(
      (a) =>
        a.employeeId === employeeId &&
        this.approvalCoversDay(a, dayStart, dayEnd),
    );
    const empVacations = vacations.filter(
      (v) =>
        v.employeeId === employeeId &&
        v.scheduledStart != null &&
        v.scheduledEnd != null &&
        v.scheduledStart <= dayEnd &&
        v.scheduledEnd >= dayStart,
    );
    const empShifts = shiftAssignments.filter(
      (s) =>
        s.employeeId === employeeId &&
        s.startDate <= dayEnd &&
        (s.endDate == null || s.endDate >= dayStart),
    );

    // 1. Highest priority — JUSTIFICADO (vacation/leave covers the day)
    if (empVacations.length > 0) {
      const result: HeatmapStatus[] = ['JUSTIFICADO'];
      this.appendOvertimeIfAny(result, empTimeEntries, empShifts);
      return result;
    }

    // 2. EXCEÇÃO — pending or resolved punch approval
    if (empApprovals.length > 0) {
      const result: HeatmapStatus[] = ['EXCEÇÃO'];
      this.appendOvertimeIfAny(result, empTimeEntries, empShifts);
      return result;
    }

    // 3. No shift assigned that day → NORMAL (employee has no expectation,
    // weekends/days off render as NORMAL by default — no FALTA without shift)
    if (empShifts.length === 0) {
      const result: HeatmapStatus[] = ['NORMAL'];
      this.appendOvertimeIfAny(result, empTimeEntries, empShifts);
      return result;
    }

    // 4. FALTA — has shift but no entries (and not a weekend without entries)
    if (empTimeEntries.length === 0) {
      // Weekend without shift expectation: NORMAL. But if isActive shift covers
      // the weekend day (e.g. rotating), FALTA still applies.
      if (isWeekend) {
        return ['NORMAL'];
      }
      return ['FALTA'];
    }

    // 5. ATRASO — first entry > shift.startTime + tolerance
    const shift = empShifts[0].shift;
    const shiftStartMin = hhmmToMinutes(shift.startTime);
    const sortedEntries = [...empTimeEntries].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const firstEntryMin = minutesFromMidnightUTC(sortedEntries[0].timestamp);
    const isLate = firstEntryMin > shiftStartMin + this.toleranceMinutes;

    const result: HeatmapStatus[] = isLate ? ['ATRASO'] : ['NORMAL'];
    this.appendOvertimeIfAny(result, empTimeEntries, empShifts);
    return result;
  }

  private appendOvertimeIfAny(
    statuses: HeatmapStatus[],
    entries: Array<{ timestamp: Date }>,
    shifts: Array<{ shift: { startTime: string; endTime: string } }>,
  ): void {
    if (entries.length === 0 || shifts.length === 0) return;
    const shift = shifts[0].shift;
    const startMin = hhmmToMinutes(shift.startTime);
    const endMin = hhmmToMinutes(shift.endTime);
    const hasOvertime = entries.some((e) => {
      const min = minutesFromMidnightUTC(e.timestamp);
      return min < startMin || min > endMin;
    });
    if (hasOvertime && !statuses.includes('HORA_EXTRA')) {
      statuses.push('HORA_EXTRA');
    }
  }
}
