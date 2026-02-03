import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import { VacationPeriod } from '@/entities/hr/vacation-period';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RequestVacationUseCase } from './request-vacation';

let absencesRepository: InMemoryAbsencesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: RequestVacationUseCase;
let testEmployee: Employee;
let testVacationPeriod: VacationPeriod;
const tenantId = new UniqueEntityID().toString();

describe('Request Vacation Use Case', () => {
  beforeEach(async () => {
    absencesRepository = new InMemoryAbsencesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new RequestVacationUseCase(
      absencesRepository,
      employeesRepository,
      vacationPeriodsRepository,
    );

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Create vacation period with 30 available days
    const now = new Date();
    const acquisitionStart = new Date(now);
    acquisitionStart.setFullYear(now.getFullYear() - 2);
    const acquisitionEnd = new Date(acquisitionStart);
    acquisitionEnd.setFullYear(acquisitionStart.getFullYear() + 1);
    const concessionStart = new Date(acquisitionEnd);
    const concessionEnd = new Date(concessionStart);
    concessionEnd.setFullYear(concessionStart.getFullYear() + 1);

    testVacationPeriod = await vacationPeriodsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      acquisitionStart,
      acquisitionEnd,
      concessionStart,
      concessionEnd,
      totalDays: 30,
      usedDays: 0,
      soldDays: 0,
      remainingDays: 30,
      status: 'AVAILABLE',
    });
  });

  it('should request vacation successfully', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 35); // 35 days in the future (> 30 days notice)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 9); // 10 days vacation

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      vacationPeriodId: testVacationPeriod.id.toString(),
      startDate,
      endDate,
      reason: 'Annual vacation for rest and relaxation',
    });

    expect(result.absence).toBeDefined();
    expect(result.absence.employeeId.equals(testEmployee.id)).toBe(true);
    expect(result.absence.type.isVacation()).toBe(true);
    expect(result.absence.status.isPending()).toBe(true);
    expect(result.absence.totalDays).toBe(10);
  });

  it('should throw error if employee not found', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 35);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 9);

    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        vacationPeriodId: testVacationPeriod.id.toString(),
        startDate,
        endDate,
        reason: 'Annual vacation',
      }),
    ).rejects.toThrow('Employee not found');
  });

  it('should throw error if vacation period not found', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 35);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 9);

    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        vacationPeriodId: new UniqueEntityID().toString(),
        startDate,
        endDate,
        reason: 'Annual vacation',
      }),
    ).rejects.toThrow('VacationPeriod not found');
  });

  it('should throw error if not enough days available', async () => {
    // Create vacation period with only 5 remaining days
    const lowDaysPeriod = await vacationPeriodsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      acquisitionStart: new Date('2021-01-01'),
      acquisitionEnd: new Date('2022-01-01'),
      concessionStart: new Date('2022-01-01'),
      concessionEnd: new Date('2023-12-31'),
      totalDays: 30,
      usedDays: 25,
      soldDays: 0,
      remainingDays: 5,
      status: 'AVAILABLE',
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 35);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 9); // Requesting 10 days

    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        vacationPeriodId: lowDaysPeriod.id.toString(),
        startDate,
        endDate,
        reason: 'Annual vacation',
      }),
    ).rejects.toThrow('Não há dias de férias suficientes disponíveis');
  });

  it('should throw error if vacation period is less than 5 days', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 35);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // Only 3 days

    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        vacationPeriodId: testVacationPeriod.id.toString(),
        startDate,
        endDate,
        reason: 'Annual vacation',
      }),
    ).rejects.toThrow('O período mínimo de férias é de 5 dias');
  });

  it('should throw error if less than 30 days advance notice', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 15); // Only 15 days notice
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 9);

    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        vacationPeriodId: testVacationPeriod.id.toString(),
        startDate,
        endDate,
        reason: 'Annual vacation',
      }),
    ).rejects.toThrow(
      'As férias devem ser solicitadas com pelo menos 30 dias de antecedência',
    );
  });

  it('should throw error if employee is not active', async () => {
    const inactiveEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Inactive Employee',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date(),
      status: EmployeeStatus.TERMINATED(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 35);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 9);

    await expect(
      sut.execute({
        tenantId,
        employeeId: inactiveEmployee.id.toString(),
        vacationPeriodId: testVacationPeriod.id.toString(),
        startDate,
        endDate,
        reason: 'Annual vacation',
      }),
    ).rejects.toThrow('Funcionário não está ativo');
  });
});
