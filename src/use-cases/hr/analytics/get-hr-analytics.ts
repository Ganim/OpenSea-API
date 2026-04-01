import { prisma } from '@/lib/prisma';
import type { EmployeeStatus } from '@prisma/generated';

interface GetHRAnalyticsRequest {
  tenantId: string;
}

interface DepartmentCount {
  name: string;
  count: number;
}

interface ContractTypeCount {
  name: string;
  count: number;
}

interface AbsenceTypeCount {
  name: string;
  count: number;
}

interface MonthlyPayroll {
  month: string;
  bruto: number;
  liquido: number;
}

interface MonthlyOvertime {
  month: string;
  horas: number;
  count: number;
}

interface MonthlyBonusVsDeduction {
  month: string;
  bonificacoes: number;
  deducoes: number;
}

interface TurnoverDataPoint {
  month: string;
  rate: number;
  terminations: number;
  avgHeadcount: number;
}

interface ComplianceAlert {
  id: string;
  type: 'medical_exam_expiring' | 'vacation_overdue';
  severity: 'warning' | 'critical';
  employeeId: string;
  employeeName: string;
  description: string;
  detail: string;
  link: string;
}

interface BirthdayEmployee {
  id: string;
  fullName: string;
  photoUrl: string | null;
  birthDate: string;
  departmentName: string;
  dayOfMonth: number;
}

interface ProbationEnding {
  id: string;
  fullName: string;
  hireDate: string;
  departmentName: string;
  daysRemaining: number;
  probationEndDate: string;
}

export interface GetHRAnalyticsResponse {
  // KPIs
  totalEmployees: number;
  pendingOvertime: number;
  activeAbsences: number;
  currentPayrollNet: number;
  pendingApprovals: number;
  overdueVacations: number;

  // Chart data
  employeesByDepartment: DepartmentCount[];
  employeesByContractType: ContractTypeCount[];
  absencesByType: AbsenceTypeCount[];
  payrollTrend: MonthlyPayroll[];
  overtimeTrend: MonthlyOvertime[];
  bonusesVsDeductions: MonthlyBonusVsDeduction[];
  turnoverTrend: TurnoverDataPoint[];

  // Widget data
  complianceAlerts: ComplianceAlert[];
  birthdaysThisMonth: BirthdayEmployee[];
  probationEndings: ProbationEnding[];
}

// ============================================================================
// HELPERS
// ============================================================================

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  INTERN: 'Estagiário',
  TEMPORARY: 'Temporário',
  APPRENTICE: 'Aprendiz',
};

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  VACATION: 'Férias',
  SICK_LEAVE: 'Atestado',
  PERSONAL_LEAVE: 'Pessoal',
  MATERNITY_LEAVE: 'Maternidade',
  PATERNITY_LEAVE: 'Paternidade',
  BEREAVEMENT_LEAVE: 'Luto',
  WEDDING_LEAVE: 'Casamento',
  MEDICAL_APPOINTMENT: 'Consulta',
  JURY_DUTY: 'Júri',
  UNPAID_LEAVE: 'S/ Remuneração',
  OTHER: 'Outro',
};

function getLast6Months(): {
  key: string;
  sortKey: number;
  start: Date;
  end: Date;
}[] {
  const months: { key: string; sortKey: number; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    months.push({
      key: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      sortKey: d.getFullYear() * 100 + d.getMonth(),
      start: d,
      end,
    });
  }
  return months;
}

function daysBetween(d1: Date, d2: Date): number {
  const ms = d2.getTime() - d1.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// ============================================================================
// USE CASE
// ============================================================================

export class GetHRAnalyticsUseCase {
  async execute(
    request: GetHRAnalyticsRequest,
  ): Promise<GetHRAnalyticsResponse> {
    const { tenantId } = request;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const last6 = getLast6Months();
    const sixMonthsAgo = last6[0].start;
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const ninetyDaysFromNow = new Date(now);
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    // Active employee statuses
    const activeStatuses: EmployeeStatus[] = [
      'ACTIVE',
      'ON_LEAVE',
      'VACATION',
      'SUSPENDED',
    ];

    // ========================================================================
    // PARALLEL DATABASE QUERIES
    // ========================================================================
    const [
      // KPI counts
      totalActiveEmployees,
      pendingOvertimeCount,
      activeAbsencesCount,
      currentPayroll,
      pendingAbsenceCount,
      pendingVacationCount,

      // Group-by queries
      employeesByDeptRaw,
      employeesByContractRaw,
      absencesByTypeRaw,

      // Trend data (raw records for aggregation)
      payrollsLast6,
      overtimeLast6,
      bonusesLast6,
      deductionsLast6,
      terminationsLast6,

      // Widget data
      medicalExamsExpiring,
      overdueVacationPeriods,
      activeEmployeesForBirthdays,
      recentHiresForProbation,
    ] = await Promise.all([
      // 1. Total active employees
      prisma.employee.count({
        where: { tenantId, status: { in: activeStatuses }, deletedAt: null },
      }),

      // 2. Pending overtime (not approved, not rejected)
      prisma.overtime.count({
        where: { tenantId, approved: false, rejected: false },
      }),

      // 3. Active absences (IN_PROGRESS or APPROVED)
      prisma.absence.count({
        where: {
          tenantId,
          status: { in: ['IN_PROGRESS', 'APPROVED'] },
          deletedAt: null,
        },
      }),

      // 4. Current month payroll
      prisma.payroll.findFirst({
        where: {
          tenantId,
          referenceMonth: currentMonth,
          referenceYear: currentYear,
        },
        select: { totalNet: true },
      }),

      // 5. Pending absence requests
      prisma.absence.count({
        where: { tenantId, status: 'PENDING', deletedAt: null },
      }),

      // 6. Pending vacation requests
      prisma.vacationPeriod.count({
        where: { tenantId, status: 'PENDING' },
      }),

      // 7. Employees by department (group by)
      prisma.employee.groupBy({
        by: ['departmentId'],
        where: { tenantId, status: { in: activeStatuses }, deletedAt: null },
        _count: { id: true },
      }),

      // 8. Employees by contract type (group by)
      prisma.employee.groupBy({
        by: ['contractType'],
        where: { tenantId, status: { in: activeStatuses }, deletedAt: null },
        _count: { id: true },
      }),

      // 9. Absences by type (group by)
      prisma.absence.groupBy({
        by: ['type'],
        where: { tenantId, deletedAt: null },
        _count: { id: true },
      }),

      // 10. Payrolls last 6 months
      prisma.payroll.findMany({
        where: {
          tenantId,
          OR: last6.map((m) => {
            const monthDate = m.start;
            return {
              referenceYear: monthDate.getFullYear(),
              referenceMonth: monthDate.getMonth() + 1,
            };
          }),
        },
        select: {
          referenceMonth: true,
          referenceYear: true,
          totalGross: true,
          totalNet: true,
        },
      }),

      // 11. Overtime last 6 months
      prisma.overtime.findMany({
        where: { tenantId, date: { gte: sixMonthsAgo } },
        select: { date: true, hours: true },
      }),

      // 12. Bonuses last 6 months
      prisma.bonus.findMany({
        where: { tenantId, date: { gte: sixMonthsAgo } },
        select: { date: true, amount: true },
      }),

      // 13. Deductions last 6 months
      prisma.deduction.findMany({
        where: { tenantId, date: { gte: sixMonthsAgo } },
        select: { date: true, amount: true },
      }),

      // 14. Terminations last 6 months
      prisma.termination.findMany({
        where: { tenantId, terminationDate: { gte: sixMonthsAgo } },
        select: { terminationDate: true },
      }),

      // 15. Medical exams expiring in next 30 days
      prisma.medicalExam.findMany({
        where: {
          tenantId,
          expirationDate: { gt: now, lte: thirtyDaysFromNow },
          employee: { status: { in: activeStatuses }, deletedAt: null },
        },
        select: {
          id: true,
          type: true,
          expirationDate: true,
          employeeId: true,
          employee: { select: { fullName: true, status: true } },
        },
      }),

      // 16. Overdue vacation periods
      prisma.vacationPeriod.findMany({
        where: {
          tenantId,
          status: { in: ['AVAILABLE', 'PENDING'] },
          concessionEnd: { lt: now },
          remainingDays: { gt: 0 },
          employee: { status: { in: activeStatuses }, deletedAt: null },
        },
        select: {
          id: true,
          employeeId: true,
          acquisitionStart: true,
          acquisitionEnd: true,
          concessionEnd: true,
          employee: { select: { fullName: true } },
        },
      }),

      // 17. Active employees for birthday check (this month)
      prisma.employee.findMany({
        where: {
          tenantId,
          status: { in: activeStatuses },
          deletedAt: null,
          birthDate: { not: null },
        },
        select: {
          id: true,
          fullName: true,
          photoUrl: true,
          birthDate: true,
          department: { select: { name: true } },
        },
      }),

      // 18. Recent hires for probation check (hired within last 90 days)
      prisma.employee.findMany({
        where: {
          tenantId,
          status: { in: activeStatuses },
          deletedAt: null,
          hireDate: {
            gte: new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - 90,
            ),
          },
        },
        select: {
          id: true,
          fullName: true,
          hireDate: true,
          department: { select: { name: true } },
        },
      }),
    ]);

    // ========================================================================
    // PENDING APPROVALS
    // ========================================================================
    const pendingOvertimeForApproval = pendingOvertimeCount; // already counted
    const pendingApprovals =
      pendingAbsenceCount + pendingOvertimeForApproval + pendingVacationCount;

    // ========================================================================
    // EMPLOYEES BY DEPARTMENT (resolve department names)
    // ========================================================================
    const deptIds = employeesByDeptRaw
      .map((g) => g.departmentId)
      .filter((id): id is string => id !== null);

    let deptNameMap = new Map<string, string>();
    if (deptIds.length > 0) {
      const departments = await prisma.department.findMany({
        where: { id: { in: deptIds } },
        select: { id: true, name: true },
      });
      deptNameMap = new Map(departments.map((d) => [d.id, d.name]));
    }

    const employeesByDepartment: DepartmentCount[] = employeesByDeptRaw
      .map((g) => ({
        name: g.departmentId
          ? (deptNameMap.get(g.departmentId) ?? 'Sem Departamento')
          : 'Sem Departamento',
        count: g._count.id,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ========================================================================
    // EMPLOYEES BY CONTRACT TYPE
    // ========================================================================
    const employeesByContractType: ContractTypeCount[] = employeesByContractRaw
      .map((g) => ({
        name: CONTRACT_TYPE_LABELS[g.contractType] ?? g.contractType,
        count: g._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    // ========================================================================
    // ABSENCES BY TYPE
    // ========================================================================
    const absencesByType: AbsenceTypeCount[] = absencesByTypeRaw
      .map((g) => ({
        name: ABSENCE_TYPE_LABELS[g.type] ?? g.type,
        count: g._count.id,
      }))
      .sort((a, b) => b.count - a.count);

    // ========================================================================
    // PAYROLL TREND
    // ========================================================================
    const payrollMap = new Map<string, { bruto: number; liquido: number }>();
    for (const p of payrollsLast6) {
      const monthIdx = p.referenceMonth - 1;
      const key = `${MONTH_NAMES[monthIdx]} ${String(p.referenceYear).slice(2)}`;
      const existing = payrollMap.get(key) ?? { bruto: 0, liquido: 0 };
      payrollMap.set(key, {
        bruto: existing.bruto + Number(p.totalGross),
        liquido: existing.liquido + Number(p.totalNet),
      });
    }
    const payrollTrend: MonthlyPayroll[] = last6.map((m) => ({
      month: m.key,
      bruto: payrollMap.get(m.key)?.bruto ?? 0,
      liquido: payrollMap.get(m.key)?.liquido ?? 0,
    }));

    // ========================================================================
    // OVERTIME TREND
    // ========================================================================
    const overtimeByMonth = new Map<string, { horas: number; count: number }>();
    for (const o of overtimeLast6) {
      const d = new Date(o.date);
      const key = `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      const existing = overtimeByMonth.get(key) ?? { horas: 0, count: 0 };
      overtimeByMonth.set(key, {
        horas: existing.horas + Number(o.hours),
        count: existing.count + 1,
      });
    }
    const overtimeTrend: MonthlyOvertime[] = last6.map((m) => ({
      month: m.key,
      horas: overtimeByMonth.get(m.key)?.horas ?? 0,
      count: overtimeByMonth.get(m.key)?.count ?? 0,
    }));

    // ========================================================================
    // BONUSES VS DEDUCTIONS
    // ========================================================================
    const bonusByMonth = new Map<string, number>();
    for (const b of bonusesLast6) {
      const d = new Date(b.date);
      const key = `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      bonusByMonth.set(key, (bonusByMonth.get(key) ?? 0) + Number(b.amount));
    }
    const deductionByMonth = new Map<string, number>();
    for (const dd of deductionsLast6) {
      const d = new Date(dd.date);
      const key = `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      deductionByMonth.set(
        key,
        (deductionByMonth.get(key) ?? 0) + Number(dd.amount),
      );
    }
    const bonusesVsDeductions: MonthlyBonusVsDeduction[] = last6.map((m) => ({
      month: m.key,
      bonificacoes: bonusByMonth.get(m.key) ?? 0,
      deducoes: deductionByMonth.get(m.key) ?? 0,
    }));

    // ========================================================================
    // TURNOVER TREND
    // ========================================================================
    const terminationsByMonth = new Map<string, number>();
    for (const t of terminationsLast6) {
      const d = new Date(t.terminationDate);
      const key = `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      terminationsByMonth.set(key, (terminationsByMonth.get(key) ?? 0) + 1);
    }
    const avgHeadcount = totalActiveEmployees;
    const turnoverTrend: TurnoverDataPoint[] = last6.map((m) => {
      const terms = terminationsByMonth.get(m.key) ?? 0;
      const rate =
        avgHeadcount > 0
          ? Number(((terms / avgHeadcount) * 100).toFixed(1))
          : 0;
      return { month: m.key, terminations: terms, avgHeadcount, rate };
    });

    // ========================================================================
    // COMPLIANCE ALERTS
    // ========================================================================
    const complianceAlerts: ComplianceAlert[] = [];

    // Medical exams expiring
    for (const exam of medicalExamsExpiring) {
      if (!exam.expirationDate) continue;
      const expDate = new Date(exam.expirationDate);
      const daysLeft = daysBetween(now, expDate);
      complianceAlerts.push({
        id: `med-${exam.id}`,
        type: 'medical_exam_expiring',
        severity: daysLeft <= 7 ? 'critical' : 'warning',
        employeeId: exam.employeeId,
        employeeName: exam.employee.fullName,
        description: `Exame médico vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`,
        detail: `Tipo: ${exam.type} - Vencimento: ${expDate.toLocaleDateString('pt-BR')}`,
        link: `/hr/employees/${exam.employeeId}`,
      });
    }

    // Overdue vacations
    const uniqueOverdueEmployeeIds = new Set<string>();
    for (const vp of overdueVacationPeriods) {
      const daysOverdue = daysBetween(new Date(vp.concessionEnd), now);
      complianceAlerts.push({
        id: `vac-${vp.id}`,
        type: 'vacation_overdue',
        severity: daysOverdue > 60 ? 'critical' : 'warning',
        employeeId: vp.employeeId,
        employeeName: vp.employee.fullName,
        description: `Férias vencidas há ${daysOverdue} dia${daysOverdue !== 1 ? 's' : ''}`,
        detail: `Período aquisitivo: ${new Date(vp.acquisitionStart).toLocaleDateString('pt-BR')} - ${new Date(vp.acquisitionEnd).toLocaleDateString('pt-BR')}`,
        link: `/hr/vacations`,
      });
      uniqueOverdueEmployeeIds.add(vp.employeeId);
    }

    complianceAlerts.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
      return a.description.localeCompare(b.description);
    });

    const overdueVacations = uniqueOverdueEmployeeIds.size;

    // ========================================================================
    // BIRTHDAYS THIS MONTH
    // ========================================================================
    const birthdaysThisMonth: BirthdayEmployee[] = [];
    const currentMonthIndex = now.getMonth();
    for (const emp of activeEmployeesForBirthdays) {
      if (!emp.birthDate) continue;
      const bd = new Date(emp.birthDate);
      if (bd.getMonth() === currentMonthIndex) {
        birthdaysThisMonth.push({
          id: emp.id,
          fullName: emp.fullName,
          photoUrl: emp.photoUrl,
          birthDate: emp.birthDate.toISOString(),
          departmentName: emp.department?.name ?? 'Sem Departamento',
          dayOfMonth: bd.getDate(),
        });
      }
    }
    birthdaysThisMonth.sort((a, b) => a.dayOfMonth - b.dayOfMonth);

    // ========================================================================
    // PROBATION ENDINGS (within next 30 days)
    // ========================================================================
    const probationEndings: ProbationEnding[] = [];
    for (const emp of recentHiresForProbation) {
      const hireDate = new Date(emp.hireDate);
      const probationEnd = new Date(hireDate);
      probationEnd.setDate(probationEnd.getDate() + 90);
      if (probationEnd > now && probationEnd <= thirtyDaysFromNow) {
        const daysRemaining = daysBetween(now, probationEnd);
        probationEndings.push({
          id: emp.id,
          fullName: emp.fullName,
          hireDate: emp.hireDate.toISOString(),
          departmentName: emp.department?.name ?? 'Sem Departamento',
          daysRemaining,
          probationEndDate: probationEnd.toISOString(),
        });
      }
    }
    probationEndings.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // ========================================================================
    // RESPONSE
    // ========================================================================
    return {
      totalEmployees: totalActiveEmployees,
      pendingOvertime: pendingOvertimeCount,
      activeAbsences: activeAbsencesCount,
      currentPayrollNet: currentPayroll ? Number(currentPayroll.totalNet) : 0,
      pendingApprovals,
      overdueVacations,
      employeesByDepartment,
      employeesByContractType,
      absencesByType,
      payrollTrend,
      overtimeTrend,
      bonusesVsDeductions,
      turnoverTrend,
      complianceAlerts,
      birthdaysThisMonth,
      probationEndings,
    };
  }
}
