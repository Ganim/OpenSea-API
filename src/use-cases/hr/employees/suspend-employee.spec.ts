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
import { SuspendEmployeeUseCase } from './suspend-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: SuspendEmployeeUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Suspend Employee Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new SuspendEmployeeUseCase(employeesRepository);
  });

  it('should suspend an active employee successfully', async () => {
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

    const result = await sut.execute({
      tenantId,
      employeeId: createdEmployee.id.toString(),
      reason: 'Falta grave',
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.status.value).toBe('SUSPENDED');
    expect(result.employee.metadata).toHaveProperty(
      'suspensionReason',
      'Falta grave',
    );
    expect(result.employee.metadata).toHaveProperty('suspendedAt');
  });

  it('should throw error when employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: 'non-existent-id',
        reason: 'Falta grave',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error when employee is already suspended', async () => {
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

    await expect(
      sut.execute({
        tenantId,
        employeeId: createdEmployee.id.toString(),
        reason: 'Falta grave',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw error when employee is on leave', async () => {
    const createdEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ON_LEAVE(),
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
        reason: 'Falta grave',
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
        reason: 'Falta grave',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
