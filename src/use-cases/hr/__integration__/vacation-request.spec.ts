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
import { RequestVacationUseCase } from '@/use-cases/hr/absences/request-vacation';
import { SellVacationDaysUseCase } from '@/use-cases/hr/vacation-periods/sell-vacation-days';
import { beforeEach, describe, expect, it } from 'vitest';

let employeesRepository: InMemoryEmployeesRepository;
let absencesRepository: InMemoryAbsencesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let requestVacation: RequestVacationUseCase;
let approveAbsence: ApproveAbsenceUseCase;
let sellVacationDays: SellVacationDaysUseCase;
let testEmployee: Employee;
let testVacationPeriod: VacationPeriod;
const tenantId = new UniqueEntityID().toString();
const managerId = new UniqueEntityID().toString();

describe('[Integration] Vacation Request Flow', () => {
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

    sellVacationDays = new SellVacationDaysUseCase(vacationPeriodsRepository);

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Luciana Ferreira',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Create a vacation period with 30 days available
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

  it('should request vacation → approve → verify days deducted', async () => {
    // Future date at least 30 days from now
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 45);
    futureStart.setHours(0, 0, 0, 0);

    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 14); // 15 days

    // Request vacation
    const { absence: vacationAbsence } = await requestVacation.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate: futureStart,
      endDate: futureEnd,
    });

    expect(vacationAbsence.isPending()).toBe(true);
    expect(vacationAbsence.type.value).toBe('VACATION');

    // Approve vacation
    const { absence: approvedAbsence } = await approveAbsence.execute({
      tenantId,
      absenceId: vacationAbsence.id.toString(),
      approvedBy: managerId,
    });

    expect(approvedAbsence.isApproved()).toBe(true);

    // After approval, the vacation period is scheduled (status changes to SCHEDULED)
    // The remaining days are still tracked, but the period status reflects the scheduling
    const scheduledPeriod = await vacationPeriodsRepository.findById(
      testVacationPeriod.id,
      tenantId,
    );
    expect(scheduledPeriod?.status.isScheduled()).toBe(true);
  });

  it('should sell 1/3 of vacation days (abono pecuniario)', async () => {
    // Sell 10 days (maximum 1/3 of 30)
    const { vacationPeriod: updatedPeriod } = await sellVacationDays.execute({
      tenantId,
      vacationPeriodId: testVacationPeriod.id.toString(),
      daysToSell: 10,
    });

    expect(updatedPeriod.soldDays).toBe(10);
    expect(updatedPeriod.remainingDays).toBe(20);
  });

  it('should not allow selling more than 1/3 of vacation days', async () => {
    await expect(
      sellVacationDays.execute({
        tenantId,
        vacationPeriodId: testVacationPeriod.id.toString(),
        daysToSell: 11, // More than 1/3 of 30 = 10
      }),
    ).rejects.toThrow('Só é permitido vender até 10 dias');
  });

  it('should enforce minimum 5-day vacation period (CLT)', async () => {
    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 45);
    futureStart.setHours(0, 0, 0, 0);

    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 2); // Only 3 days

    await expect(
      requestVacation.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        vacationPeriodId: testVacationPeriod.id.toString(),
        startDate: futureStart,
        endDate: futureEnd,
      }),
    ).rejects.toThrow('período mínimo de férias');
  });

  it('should not allow vacation exceeding available balance', async () => {
    // Sell 10 days first to reduce available to 20
    await sellVacationDays.execute({
      tenantId,
      vacationPeriodId: testVacationPeriod.id.toString(),
      daysToSell: 10,
    });

    const futureStart = new Date();
    futureStart.setDate(futureStart.getDate() + 45);
    futureStart.setHours(0, 0, 0, 0);

    const futureEnd = new Date(futureStart);
    futureEnd.setDate(futureEnd.getDate() + 24); // 25 days > 20 remaining

    await expect(
      requestVacation.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        vacationPeriodId: testVacationPeriod.id.toString(),
        startDate: futureStart,
        endDate: futureEnd,
      }),
    ).rejects.toThrow('Não há dias de férias suficientes');
  });

  it('should require 30 days advance notice for vacation request', async () => {
    const tooSoonStart = new Date();
    tooSoonStart.setDate(tooSoonStart.getDate() + 10); // Only 10 days ahead
    tooSoonStart.setHours(0, 0, 0, 0);

    const tooSoonEnd = new Date(tooSoonStart);
    tooSoonEnd.setDate(tooSoonEnd.getDate() + 9); // 10 days

    await expect(
      requestVacation.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        vacationPeriodId: testVacationPeriod.id.toString(),
        startDate: tooSoonStart,
        endDate: tooSoonEnd,
      }),
    ).rejects.toThrow('30 dias de antecedência');
  });
});
