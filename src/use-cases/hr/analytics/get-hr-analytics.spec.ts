import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetHRAnalyticsUseCase } from './get-hr-analytics';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
      findMany: vi.fn().mockResolvedValue([]),
    },
    overtime: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    absence: {
      count: vi.fn().mockResolvedValue(0),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    payroll: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    vacationPeriod: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    bonus: { findMany: vi.fn().mockResolvedValue([]) },
    deduction: { findMany: vi.fn().mockResolvedValue([]) },
    termination: { findMany: vi.fn().mockResolvedValue([]) },
    medicalExam: { findMany: vi.fn().mockResolvedValue([]) },
    department: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

let sut: GetHRAnalyticsUseCase;

describe('GetHRAnalyticsUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sut = new GetHRAnalyticsUseCase();
  });

  it('should return analytics with all zeroed KPIs when no data', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.totalEmployees).toBe(0);
    expect(result.pendingOvertime).toBe(0);
    expect(result.activeAbsences).toBe(0);
    expect(result.currentPayrollNet).toBe(0);
    expect(result.pendingApprovals).toBe(0);
    expect(result.overdueVacations).toBe(0);
  });

  it('should return empty arrays for chart and widget data when no data', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.employeesByDepartment).toEqual([]);
    expect(result.employeesByContractType).toEqual([]);
    expect(result.absencesByType).toEqual([]);
    expect(result.complianceAlerts).toEqual([]);
    expect(result.birthdaysThisMonth).toEqual([]);
    expect(result.probationEndings).toEqual([]);
  });

  it('should return 6 months of payroll, overtime, bonus, and turnover trend data', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.payrollTrend).toHaveLength(6);
    expect(result.overtimeTrend).toHaveLength(6);
    expect(result.bonusesVsDeductions).toHaveLength(6);
    expect(result.turnoverTrend).toHaveLength(6);
  });

  it('should calculate pendingApprovals as sum of pending absences, overtime, and vacations', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.absence.count as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(0) // active absences
      .mockResolvedValueOnce(3); // pending absences
    (prisma.overtime.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    (prisma.vacationPeriod.count as ReturnType<typeof vi.fn>).mockResolvedValue(
      1,
    );

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.pendingApprovals).toBe(6); // 3 + 2 + 1
  });

  it('should return currentPayrollNet from payroll data', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.payroll.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      totalNet: 50000,
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.currentPayrollNet).toBe(50000);
  });

  it('should populate payroll trend from payroll records', async () => {
    const { prisma } = await import('@/lib/prisma');
    const now = new Date();
    (prisma.payroll.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        referenceMonth: now.getMonth() + 1,
        referenceYear: now.getFullYear(),
        totalGross: 100000,
        totalNet: 80000,
      },
    ]);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    const currentMonthData =
      result.payrollTrend[result.payrollTrend.length - 1];
    expect(currentMonthData.bruto).toBe(100000);
    expect(currentMonthData.liquido).toBe(80000);
  });

  it('should resolve department names for employeesByDepartment', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.employee.groupBy as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([
        { departmentId: 'dept-1', _count: { id: 5 } },
        { departmentId: null, _count: { id: 2 } },
      ])
      .mockResolvedValueOnce([]); // contract type groupBy
    (prisma.department.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'dept-1', name: 'Engenharia' },
    ]);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.employeesByDepartment).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Engenharia', count: 5 }),
        expect.objectContaining({ name: 'Sem Departamento', count: 2 }),
      ]),
    );
  });

  it('should map contract type labels', async () => {
    const { prisma } = await import('@/lib/prisma');
    (prisma.employee.groupBy as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([]) // dept groupBy
      .mockResolvedValueOnce([
        { contractType: 'CLT', _count: { id: 10 } },
        { contractType: 'INTERN', _count: { id: 2 } },
      ]);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.employeesByContractType).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'CLT', count: 10 }),
        expect.objectContaining({ name: 'Estagiário', count: 2 }),
      ]),
    );
  });

  it('should calculate turnover rate correctly', async () => {
    const { prisma } = await import('@/lib/prisma');
    const now = new Date();
    (prisma.employee.count as ReturnType<typeof vi.fn>).mockResolvedValue(100);
    (prisma.termination.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      [{ terminationDate: now }, { terminationDate: now }],
    );

    const result = await sut.execute({ tenantId: 'tenant-1' });

    const currentMonthTurnover =
      result.turnoverTrend[result.turnoverTrend.length - 1];
    expect(currentMonthTurnover.terminations).toBe(2);
    expect(currentMonthTurnover.avgHeadcount).toBe(100);
    expect(currentMonthTurnover.rate).toBe(2);
  });
});
