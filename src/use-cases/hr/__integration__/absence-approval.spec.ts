import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  VacationStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { ApproveAbsenceUseCase } from '@/use-cases/hr/absences/approve-absence';
import { CalculateVacationBalanceUseCase } from '@/use-cases/hr/absences/calculate-vacation-balance';
import { RejectAbsenceUseCase } from '@/use-cases/hr/absences/reject-absence';
import { RequestVacationUseCase } from '@/use-cases/hr/absences/request-vacation';
import { beforeEach, describe, expect, it } from 'vitest';

let employeesRepository: InMemoryEmployeesRepository;
let absencesRepository: InMemoryAbsencesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let requestVacation: RequestVacationUseCase;
let approveAbsence: ApproveAbsenceUseCase;
let rejectAbsence: RejectAbsenceUseCase;
let calculateVacationBalance: CalculateVacationBalanceUseCase;

let testEmployee: Employee;
let testVacationPeriod: VacationPeriod;
const tenantId = new UniqueEntityID().toString();
const managerId = new UniqueEntityID().toString();

describe('[Integration] Absence Approval Flow', () => {
  beforeEach(async () => {
    employeesRepository = new InMemoryEmployeesRepository();
    absencesRepository = new InMemoryAbsencesRepository();
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();

    requestVacation = new RequestVacationUseCase(
      absencesRepository,
      employeesRepository,
      vacationPeriodsRepository,
    );

    approveAbsence = new ApproveAbsenceUseCase(
      absencesRepository,
      vacationPeriodsRepository,
      employeesRepository,
    );

    rejectAbsence = new RejectAbsenceUseCase(absencesRepository);

    calculateVacationBalance = new CalculateVacationBalanceUseCase(
      employeesRepository,
      vacationPeriodsRepository,
    );

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Patricia Almeida',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 4500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    testVacationPeriod = VacationPeriod.create({
      tenantId: new UniqueEntityID(tenantId),
      employeeId: testEmployee.id,
      acquisitionStart: new Date('2024-01-01'),
      acquisitionEnd: new Date('2025-01-01'),
      concessionStart: new Date('2025-01-01'),
      concessionEnd: new Date('2027-12-31'),
      totalDays: 30,
      usedDays: 0,
      soldDays: 0,
      remainingDays: 30,
      status: VacationStatus.create('AVAILABLE'),
    });

    vacationPeriodsRepository.items.push(testVacationPeriod);
  });

  it('should create absence → approve → check vacation balance impact', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 45);
    futureStart.setHours(0, 0, 0, 0);

    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 9); // 10 days

    // Check initial balance
    const initialBalance = await calculateVacationBalance.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });
    expect(initialBalance.totalAvailableDays).toBe(30);

    // Request vacation
    const { absence } = await requestVacation.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate: futureStart,
      endDate: futureEnd,
    });

    expect(absence.isPending()).toBe(true);

    // Approve
    const { absence: approvedAbsence } = await approveAbsence.execute({
      tenantId,
      absenceId: absence.id.toString(),
      approvedBy: managerId,
    });

    expect(approvedAbsence.isApproved()).toBe(true);

    // After approval, the vacation period status changes to SCHEDULED
    const scheduledPeriod = await vacationPeriodsRepository.findById(
      testVacationPeriod.id,
      tenantId,
    );
    expect(scheduledPeriod?.status.isScheduled()).toBe(true);
  });

  it('should create absence → reject → check no balance impact', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 45);
    futureStart.setHours(0, 0, 0, 0);

    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 9);

    // Request vacation
    const { absence } = await requestVacation.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate: futureStart,
      endDate: futureEnd,
    });

    // Reject with a valid reason
    const { absence: rejectedAbsence } = await rejectAbsence.execute({
      tenantId,
      absenceId: absence.id.toString(),
      rejectedBy: managerId,
      reason: 'Período conflita com demanda crítica do projeto em andamento',
    });

    expect(rejectedAbsence.isRejected()).toBe(true);

    // Balance should remain unchanged
    const balance = await calculateVacationBalance.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    expect(balance.totalAvailableDays).toBe(30);
  });

  it('should not approve an already approved absence', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 45);
    futureStart.setHours(0, 0, 0, 0);

    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 9);

    const { absence } = await requestVacation.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate: futureStart,
      endDate: futureEnd,
    });

    // Approve once
    await approveAbsence.execute({
      tenantId,
      absenceId: absence.id.toString(),
      approvedBy: managerId,
    });

    // Try to approve again
    await expect(
      approveAbsence.execute({
        tenantId,
        absenceId: absence.id.toString(),
        approvedBy: managerId,
      }),
    ).rejects.toThrow('already approved');
  });

  it('should not reject an absence with insufficient reason', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 45);
    futureStart.setHours(0, 0, 0, 0);

    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 9);

    const { absence } = await requestVacation.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate: futureStart,
      endDate: futureEnd,
    });

    // Reject with too short reason
    await expect(
      rejectAbsence.execute({
        tenantId,
        absenceId: absence.id.toString(),
        rejectedBy: managerId,
        reason: 'short', // Less than 10 characters
      }),
    ).rejects.toThrow('at least 10 characters');
  });

  it('should not reject an already rejected absence', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 45);
    futureStart.setHours(0, 0, 0, 0);

    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 9);

    const { absence } = await requestVacation.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate: futureStart,
      endDate: futureEnd,
    });

    // Reject once
    await rejectAbsence.execute({
      tenantId,
      absenceId: absence.id.toString(),
      rejectedBy: managerId,
      reason: 'Período indisponível para a equipe neste momento',
    });

    // Try to reject again
    await expect(
      rejectAbsence.execute({
        tenantId,
        absenceId: absence.id.toString(),
        rejectedBy: managerId,
        reason: 'Tentativa de rejeição duplicada para o mesmo período',
      }),
    ).rejects.toThrow('Only pending absences can be rejected');
  });
});
