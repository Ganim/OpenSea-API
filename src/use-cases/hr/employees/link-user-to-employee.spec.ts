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
import { LinkUserToEmployeeUseCase } from './link-user-to-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: LinkUserToEmployeeUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Link User To Employee Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new LinkUserToEmployeeUseCase(employeesRepository);
  });

  it('should link user to employee successfully', async () => {
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

    const userId = 'user-123';
    const result = await sut.execute({
      tenantId,
      employeeId: createdEmployee.id.toString(),
      userId,
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.userId?.toString()).toBe(userId);
  });

  it('should throw error when employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: 'non-existent-id',
        userId: 'user-123',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw error when employee already has a user linked', async () => {
    const createdEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      userId: new UniqueEntityID('existing-user-id'),
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
        userId: 'new-user-id',
      }),
    ).rejects.toThrow('Employee already has a user linked');
  });

  it('should throw error when user is already linked to another employee', async () => {
    const userId = 'user-123';

    // First employee with user linked
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      userId: new UniqueEntityID(userId),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Second employee without user
    const secondEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Maria Santos',
      cpf: CPF.create('12345678909'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 2500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: secondEmployee.id.toString(),
        userId, // Same user as first employee
      }),
    ).rejects.toThrow('User is already linked to another employee');
  });
});
