import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListEmployeesUseCase } from './list-employees';

let employeesRepository: InMemoryEmployeesRepository;
let sut: ListEmployeesUseCase;

describe('List Employees Use Case', () => {
  beforeEach(async () => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ListEmployeesUseCase(employeesRepository);

    // Create test employees
    await employeesRepository.create({
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

    await employeesRepository.create({
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

    await employeesRepository.create({
      registrationNumber: 'EMP003',
      fullName: 'Carlos Oliveira',
      cpf: CPF.create('98765432100'),
      hireDate: new Date('2024-01-01'),
      status: EmployeeStatus.TERMINATED(),
      baseSalary: 4000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should list all employees', async () => {
    const result = await sut.execute({});

    expect(result.employees).toHaveLength(3);
    expect(result.meta.total).toBe(3);
  });

  it('should list employees with pagination', async () => {
    const result = await sut.execute({
      page: 1,
      perPage: 2,
    });

    expect(result.employees).toHaveLength(2);
    expect(result.meta.total).toBe(3);
    expect(result.meta.totalPages).toBe(2);
  });

  it('should filter employees by status', async () => {
    const result = await sut.execute({
      status: 'ACTIVE',
    });

    expect(result.employees).toHaveLength(2);
    expect(result.employees.every((e) => e.status.value === 'ACTIVE')).toBe(
      true,
    );
  });

  it('should filter employees by search term', async () => {
    const result = await sut.execute({
      search: 'João',
    });

    expect(result.employees).toHaveLength(1);
    expect(result.employees[0].fullName).toBe('João Silva');
  });

  it('should filter employees by registration number', async () => {
    const result = await sut.execute({
      search: 'EMP002',
    });

    expect(result.employees).toHaveLength(1);
    expect(result.employees[0].registrationNumber).toBe('EMP002');
  });

  it('should return empty list when no match', async () => {
    const result = await sut.execute({
      search: 'NonExistent',
    });

    expect(result.employees).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('should throw error for invalid status', async () => {
    await expect(
      sut.execute({
        status: 'INVALID_STATUS',
      }),
    ).rejects.toThrow('Invalid status: INVALID_STATUS');
  });
});
