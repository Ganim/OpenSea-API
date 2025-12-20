import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { CheckEmployeeCpfUseCase } from './check-employee-cpf';
import {
  CPF,
  ContractType,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { describe, it, expect, beforeEach } from 'vitest';

let employeesRepository: InMemoryEmployeesRepository;
let sut: CheckEmployeeCpfUseCase;

describe('Check Employee CPF Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CheckEmployeeCpfUseCase(employeesRepository);
  });

  it('should detect existing CPF', async () => {
    const cpf = '529.982.247-25';

    await employeesRepository.create({
      registrationNumber: 'EMP-001',
      fullName: 'João Silva',
      cpf: CPF.create(cpf),
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

    const response = await sut.execute({ cpf });

    expect(response.exists).toBe(true);
    expect(response.employeeId).toBeTruthy();
    expect(response.isDeleted).toBe(false);
  });

  it('should return false when CPF does not exist', async () => {
    const response = await sut.execute({ cpf: '123.456.789-09' });

    expect(response.exists).toBe(false);
    expect(response.employeeId).toBeNull();
    expect(response.isDeleted).toBe(false);
  });

  it('should find deleted employee when includeDeleted is true', async () => {
    const cpf = '390.533.447-05';

    const employee = await employeesRepository.create({
      registrationNumber: 'EMP-002',
      fullName: 'Maria Oliveira',
      cpf: CPF.create(cpf),
      hireDate: new Date('2024-01-01'),
      baseSalary: 3500,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.ACTIVE(),
      metadata: {},
      pendingIssues: [],
    });

    employee.softDelete();
    await employeesRepository.save(employee);

    const withoutDeleted = await sut.execute({ cpf });
    const withDeleted = await sut.execute({ cpf, includeDeleted: true });

    expect(withoutDeleted.exists).toBe(false);
    expect(withDeleted.exists).toBe(true);
    expect(withDeleted.isDeleted).toBe(true);
  });
});
