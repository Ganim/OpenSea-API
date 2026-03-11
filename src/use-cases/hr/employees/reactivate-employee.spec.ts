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
import { beforeEach, describe, expect, it } from 'vitest';
import { ReactivateEmployeeUseCase } from './reactivate-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: ReactivateEmployeeUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Reactivate Employee Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ReactivateEmployeeUseCase(employeesRepository);
  });

  it('should reactivate a suspended employee successfully', async () => {
    const createdEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.SUSPENDED(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const result = await sut.execute({
      tenantId,
      employeeId: createdEmployee.id.toString(),
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.status.value).toBe('ACTIVE');
    expect(result.employee.metadata).toHaveProperty('reactivatedAt');
  });

  it('should reactivate an employee on leave successfully', async () => {
    const createdEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Maria Souza',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ON_LEAVE(),
      baseSalary: 4000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const result = await sut.execute({
      tenantId,
      employeeId: createdEmployee.id.toString(),
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.status.value).toBe('ACTIVE');
    expect(result.employee.metadata).toHaveProperty('reactivatedAt');
  });

  it('should throw error when employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error when employee is already active', async () => {
    const createdEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: createdEmployee.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw error when employee is terminated', async () => {
    const createdEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.TERMINATED(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
      terminationDate: new Date('2024-06-01'),
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: createdEmployee.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
