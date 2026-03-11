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
import { SetEmployeeOnLeaveUseCase } from './set-employee-on-leave';

let employeesRepository: InMemoryEmployeesRepository;
let sut: SetEmployeeOnLeaveUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Set Employee On Leave Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new SetEmployeeOnLeaveUseCase(employeesRepository);
  });

  it('should set an active employee on leave successfully', async () => {
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
      reason: 'Licença médica',
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.status.value).toBe('ON_LEAVE');
    expect(result.employee.metadata).toHaveProperty(
      'leaveReason',
      'Licença médica',
    );
    expect(result.employee.metadata).toHaveProperty('leaveStartedAt');
  });

  it('should throw error when employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: 'non-existent-id',
        reason: 'Licença médica',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error when employee is suspended', async () => {
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
        reason: 'Licença médica',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw error when employee is already on leave', async () => {
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
        reason: 'Licença médica',
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
        reason: 'Licença médica',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
