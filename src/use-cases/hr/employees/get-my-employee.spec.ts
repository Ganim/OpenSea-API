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
import { GetMyEmployeeUseCase } from './get-my-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: GetMyEmployeeUseCase;
const tenantId = new UniqueEntityID().toString();

describe('GetMyEmployeeUseCase', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GetMyEmployeeUseCase(employeesRepository);
  });

  it('should throw ResourceNotFoundError when no employee record exists', async () => {
    await expect(() =>
      sut.execute({ tenantId, userId: 'unknown' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when userId does not match any employee', async () => {
    // Create an employee linked to a different user
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      userId: new UniqueEntityID(),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    await expect(() =>
      sut.execute({ tenantId, userId: new UniqueEntityID().toString() }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should return the employee record for the authenticated user', async () => {
    const userId = new UniqueEntityID();

    const createdEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Maria Santos',
      cpf: CPF.create('52998224725'),
      userId,
      email: 'maria@example.com',
      hireDate: new Date('2023-06-15'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const result = await sut.execute({
      tenantId,
      userId: userId.toString(),
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.id.equals(createdEmployee.id)).toBe(true);
    expect(result.employee.fullName).toBe('Maria Santos');
    expect(result.employee.userId?.equals(userId)).toBe(true);
    expect(result.employee.baseSalary).toBe(5000);
    expect(result.employee.registrationNumber).toBe('EMP002');
  });
});
