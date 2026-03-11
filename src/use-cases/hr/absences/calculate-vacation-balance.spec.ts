import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryVacationPeriodsRepository } from '@/repositories/hr/in-memory/in-memory-vacation-periods-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateVacationBalanceUseCase } from './calculate-vacation-balance';

let employeesRepository: InMemoryEmployeesRepository;
let vacationPeriodsRepository: InMemoryVacationPeriodsRepository;
let sut: CalculateVacationBalanceUseCase;

const tenantId = new UniqueEntityID().toString();

describe('CalculateVacationBalanceUseCase', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    vacationPeriodsRepository = new InMemoryVacationPeriodsRepository();
    sut = new CalculateVacationBalanceUseCase(
      employeesRepository,
      vacationPeriodsRepository,
    );
  });

  it('should throw ResourceNotFoundError for non-existent employee', async () => {
    await expect(() =>
      sut.execute({ tenantId, employeeId: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should return zero balance when employee has no vacation periods', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Maria Santos',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2025-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const result = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
    });

    expect(result.employeeId).toBe(employee.id.toString());
    expect(result.employeeName).toBe('Maria Santos');
    expect(result.totalAvailableDays).toBe(0);
    expect(result.totalUsedDays).toBe(0);
    expect(result.totalSoldDays).toBe(0);
    expect(result.periods).toHaveLength(0);
  });

  it('should calculate balance for employee with multiple vacation periods', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    // First period: fully used
    await vacationPeriodsRepository.create({
      tenantId,
      employeeId: employee.id,
      acquisitionStart: new Date('2022-01-01'),
      acquisitionEnd: new Date('2022-12-31'),
      concessionStart: new Date('2023-01-01'),
      concessionEnd: new Date('2023-12-31'),
      totalDays: 30,
      usedDays: 30,
      soldDays: 0,
      remainingDays: 0,
      status: 'COMPLETED',
    });

    // Second period: partially used with some sold days, still within concession
    const futureEnd = new Date();
    futureEnd.setFullYear(futureEnd.getFullYear() + 1);
    await vacationPeriodsRepository.create({
      tenantId,
      employeeId: employee.id,
      acquisitionStart: new Date('2023-01-01'),
      acquisitionEnd: new Date('2023-12-31'),
      concessionStart: new Date('2024-01-01'),
      concessionEnd: futureEnd,
      totalDays: 30,
      usedDays: 10,
      soldDays: 5,
      remainingDays: 15,
      status: 'AVAILABLE',
    });

    const result = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
    });

    expect(result.totalUsedDays).toBe(40); // 30 + 10
    expect(result.totalSoldDays).toBe(5);
    expect(result.periods).toHaveLength(2);

    // Only the second period has remaining days and is not expired
    expect(result.totalAvailableDays).toBe(15);
  });

  it('should correctly handle exactly 12 months of work (one full acquisition period)', async () => {
    const hireDate = new Date('2024-01-01');
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP003',
      fullName: 'Ana Oliveira',
      cpf: CPF.create('52998224725'),
      hireDate,
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 4000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    // One period available, concession still open (far future)
    const futureEnd = new Date();
    futureEnd.setFullYear(futureEnd.getFullYear() + 2);
    await vacationPeriodsRepository.create({
      tenantId,
      employeeId: employee.id,
      acquisitionStart: new Date('2024-01-01'),
      acquisitionEnd: new Date('2024-12-31'),
      concessionStart: new Date('2025-01-01'),
      concessionEnd: futureEnd,
      totalDays: 30,
      usedDays: 0,
      soldDays: 0,
      remainingDays: 30,
      status: 'AVAILABLE',
    });

    const result = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
    });

    expect(result.totalAvailableDays).toBe(30);
    expect(result.totalUsedDays).toBe(0);
    expect(result.totalSoldDays).toBe(0);
    expect(result.periods).toHaveLength(1);
    expect(result.periods[0].isExpired).toBe(false);
    expect(result.periods[0].daysUntilExpiration).toBeGreaterThan(0);
    expect(result.periods[0].remainingDays).toBe(30);
  });
});
