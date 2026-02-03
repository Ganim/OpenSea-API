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
import { GetEmployeeByIdUseCase } from './get-employee-by-id';

let employeesRepository: InMemoryEmployeesRepository;
let sut: GetEmployeeByIdUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Get Employee By Id Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GetEmployeeByIdUseCase(employeesRepository);
  });

  it('should get an employee by id', async () => {
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
    });

    expect(result.employee).toBeDefined();
    expect(result.employee.id.equals(createdEmployee.id)).toBe(true);
    expect(result.employee.fullName).toBe('João Silva');
  });

  it('should throw error when employee not found', async () => {
    await expect(
      sut.execute({ tenantId, employeeId: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
