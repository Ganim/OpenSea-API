import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryGeneratedEmploymentContractsRepository } from '@/repositories/hr/in-memory/in-memory-generated-employment-contracts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListEmployeeContractsUseCase } from './list-employee-contracts';

let employeesRepository: InMemoryEmployeesRepository;
let generatedContractsRepository: InMemoryGeneratedEmploymentContractsRepository;
let sut: ListEmployeeContractsUseCase;

const tenantId = new UniqueEntityID().toString();

describe('List Employee Contracts Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    generatedContractsRepository =
      new InMemoryGeneratedEmploymentContractsRepository();
    sut = new ListEmployeeContractsUseCase(
      employeesRepository,
      generatedContractsRepository,
    );
  });

  async function createEmployee() {
    return employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP-77',
      fullName: 'Letícia Borges',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2024-04-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  }

  it('lists all generated contracts for the employee, newest first', async () => {
    const employee = await createEmployee();
    const templateId = new UniqueEntityID();
    const userId = new UniqueEntityID();

    const older = await generatedContractsRepository.create({
      tenantId,
      employeeId: employee.id,
      templateId,
      generatedBy: userId,
      variables: { tag: 'older' },
    });
    const newer = await generatedContractsRepository.create({
      tenantId,
      employeeId: employee.id,
      templateId,
      generatedBy: userId,
      variables: { tag: 'newer' },
    });

    // Force a clear ordering between fixtures.
    older.props.createdAt = new Date('2026-01-01');
    newer.props.createdAt = new Date('2026-04-01');

    const { contracts } = await sut.execute({
      tenantId,
      employeeId: employee.id.toString(),
    });

    expect(contracts).toHaveLength(2);
    expect(contracts[0].variables.tag).toBe('newer');
    expect(contracts[1].variables.tag).toBe('older');
  });

  it('throws ResourceNotFoundError when the employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
