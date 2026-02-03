import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  EmployeeStatus,
  WorkRegime,
  CPF,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteEmployeeUseCase } from './delete-employee';

let employeesRepository: InMemoryEmployeesRepository;
let sut: DeleteEmployeeUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Delete Employee Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new DeleteEmployeeUseCase(employeesRepository);
  });

  it('should soft delete an employee', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP-123',
      fullName: 'John Doe',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.ACTIVE(),
      metadata: {},
      pendingIssues: [],
    });

    await sut.execute({ tenantId, employeeId: employee.id.toString() });

    const deleted = await employeesRepository.findById(
      employee.id,
      tenantId,
      true,
    );

    expect(deleted?.deletedAt).toBeTruthy();
  });

  it('should throw when employee does not exist', async () => {
    await expect(
      sut.execute({ tenantId, employeeId: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
