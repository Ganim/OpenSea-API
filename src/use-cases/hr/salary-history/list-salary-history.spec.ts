import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemorySalaryHistoryRepository } from '@/repositories/hr/in-memory/in-memory-salary-history-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListSalaryHistoryUseCase } from './list-salary-history';

let salaryHistoryRepository: InMemorySalaryHistoryRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ListSalaryHistoryUseCase;
const tenantId = new UniqueEntityID().toString();

describe('List Salary History Use Case', () => {
  beforeEach(() => {
    salaryHistoryRepository = new InMemorySalaryHistoryRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ListSalaryHistoryUseCase(
      salaryHistoryRepository,
      employeesRepository,
    );
  });

  it('should return empty history when employee has no records', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP100',
      fullName: 'Ana Maria Silveira',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2024-01-15'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 4500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const { history } = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
    });

    expect(history).toEqual([]);
  });

  it('should return history sorted desc by effective date', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP101',
      fullName: 'Bruno Tavares Marques',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 7000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const changedBy = new UniqueEntityID();

    await salaryHistoryRepository.create({
      tenantId,
      employeeId: employee.id,
      previousSalary: 5000,
      newSalary: 6000,
      reason: 'ADJUSTMENT',
      effectiveDate: new Date('2024-06-01'),
      changedBy,
    });

    await salaryHistoryRepository.create({
      tenantId,
      employeeId: employee.id,
      previousSalary: 6000,
      newSalary: 7000,
      reason: 'PROMOTION',
      effectiveDate: new Date('2025-01-01'),
      changedBy,
    });

    const { history } = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
    });

    expect(history).toHaveLength(2);
    expect(history[0].effectiveDate.getUTCFullYear()).toBe(2025);
    expect(history[1].effectiveDate.getUTCFullYear()).toBe(2024);
  });

  it('should throw when employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not return history from other tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP102',
      fullName: 'Camila Reis',
      cpf: CPF.create('111.444.777-35'),
      hireDate: new Date('2022-05-20'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 9000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    await salaryHistoryRepository.create({
      tenantId: otherTenantId,
      employeeId: employee.id,
      newSalary: 9000,
      reason: 'ADMISSION',
      effectiveDate: new Date('2022-05-20'),
      changedBy: new UniqueEntityID(),
    });

    const { history } = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
    });

    expect(history).toEqual([]);
  });
});
