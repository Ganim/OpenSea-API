import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
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
import { RegisterSalaryChangeUseCase } from './register-salary-change';

let salaryHistoryRepository: InMemorySalaryHistoryRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: RegisterSalaryChangeUseCase;
const tenantId = new UniqueEntityID().toString();

async function seedEmployee(baseSalary?: number) {
  return employeesRepository.create({
    tenantId,
    registrationNumber: 'EMP200',
    fullName: 'Daniela Martins Ribeiro',
    cpf: CPF.create('529.982.247-25'),
    hireDate: new Date('2023-03-01'),
    status: EmployeeStatus.ACTIVE(),
    baseSalary,
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'Brasil',
  });
}

describe('Register Salary Change Use Case', () => {
  beforeEach(() => {
    salaryHistoryRepository = new InMemorySalaryHistoryRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new RegisterSalaryChangeUseCase(
      salaryHistoryRepository,
      employeesRepository,
    );
  });

  it('should create a salary history record and apply when effective date is past', async () => {
    const employee = await seedEmployee(5000);
    const changedBy = new UniqueEntityID().toString();

    const { salaryHistory, appliedToEmployee, previousSalary } =
      await sut.execute({
        tenantId,
        employeeId: employee.id.toString(),
        newSalary: 6000,
        reason: 'PROMOTION',
        notes: 'Promotion to senior level',
        effectiveDate: new Date('2024-01-01'),
        changedBy,
      });

    expect(salaryHistory.newSalary).toBe(6000);
    expect(salaryHistory.previousSalary).toBe(5000);
    expect(salaryHistory.reason).toBe('PROMOTION');
    expect(previousSalary).toBe(5000);
    expect(appliedToEmployee).toBe(true);

    const updatedEmployee = await employeesRepository.findById(
      employee.id,
      tenantId,
    );
    expect(updatedEmployee?.baseSalary).toBe(6000);
  });

  it('should not apply to employee when effective date is in the future', async () => {
    const employee = await seedEmployee(5000);
    const changedBy = new UniqueEntityID().toString();
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);

    const { appliedToEmployee, salaryHistory } = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
      newSalary: 7000,
      reason: 'ADJUSTMENT',
      effectiveDate: future,
      changedBy,
    });

    expect(appliedToEmployee).toBe(false);
    expect(salaryHistory.newSalary).toBe(7000);

    const updatedEmployee = await employeesRepository.findById(
      employee.id,
      tenantId,
    );
    expect(updatedEmployee?.baseSalary).toBe(5000);
  });

  it('should accept admission with no previous salary', async () => {
    const employee = await seedEmployee(undefined);
    const changedBy = new UniqueEntityID().toString();

    const { salaryHistory, previousSalary } = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
      newSalary: 4500,
      reason: 'ADMISSION',
      effectiveDate: new Date('2024-01-01'),
      changedBy,
    });

    expect(previousSalary).toBeNull();
    expect(salaryHistory.previousSalary).toBeUndefined();
    expect(salaryHistory.newSalary).toBe(4500);
  });

  it('should reject when newSalary equals current baseSalary', async () => {
    const employee = await seedEmployee(5000);

    await expect(
      sut.execute({
        tenantId,
        employeeId: employee.id.toString(),
        newSalary: 5000,
        reason: 'ADJUSTMENT',
        effectiveDate: new Date('2024-01-01'),
        changedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject non positive salaries', async () => {
    const employee = await seedEmployee(5000);

    await expect(
      sut.execute({
        tenantId,
        employeeId: employee.id.toString(),
        newSalary: 0,
        reason: 'ADJUSTMENT',
        effectiveDate: new Date(),
        changedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError if employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        newSalary: 5000,
        reason: 'ADMISSION',
        effectiveDate: new Date(),
        changedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
