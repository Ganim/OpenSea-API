import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryBonusesRepository } from '@/repositories/hr/in-memory/in-memory-bonuses-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBonusUseCase } from './create-bonus';

let bonusesRepository: InMemoryBonusesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CreateBonusUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Create Bonus Use Case', () => {
  beforeEach(async () => {
    bonusesRepository = new InMemoryBonusesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CreateBonusUseCase(bonusesRepository, employeesRepository);

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should create a bonus successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent Q2 performance',
      date: new Date(),
    });

    expect(result.bonus).toBeDefined();
    expect(result.bonus.name).toBe('Performance Bonus');
    expect(result.bonus.amount).toBe(1000);
    expect(result.bonus.reason).toBe('Excellent Q2 performance');
    expect(result.bonus.isPaid).toBe(false);
  });

  it('should throw error if employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        name: 'Performance Bonus',
        amount: 1000,
        reason: 'Excellent performance',
        date: new Date(),
      }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should create bonus for inactive employee', async () => {
    const inactiveEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Inactive Employee',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.TERMINATED(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    // Bonus can be created for inactive employees (e.g., severance bonus)
    const result = await sut.execute({
      tenantId,
      employeeId: inactiveEmployee.id.toString(),
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent performance',
      date: new Date(),
    });

    expect(result.bonus).toBeDefined();
  });

  it('should create multiple bonuses for the same employee', async () => {
    await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Bonus 1',
      amount: 500,
      reason: 'Reason 1',
      date: new Date(),
    });

    await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Bonus 2',
      amount: 1000,
      reason: 'Reason 2',
      date: new Date(),
    });

    const bonuses = await bonusesRepository.findManyByEmployee(
      testEmployee.id,
      tenantId,
    );
    expect(bonuses).toHaveLength(2);
  });
});
