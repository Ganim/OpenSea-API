import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryDeductionsRepository } from '@/repositories/hr/in-memory/in-memory-deductions-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListDeductionsUseCase } from './list-deductions';

let deductionsRepository: InMemoryDeductionsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ListDeductionsUseCase;
let testEmployee1: Employee;
let testEmployee2: Employee;

const tenantId = new UniqueEntityID().toString();

describe('List Deductions Use Case', () => {
  beforeEach(async () => {
    deductionsRepository = new InMemoryDeductionsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ListDeductionsUseCase(deductionsRepository);

    testEmployee1 = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee 1',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    testEmployee2 = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Test Employee 2',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 6000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should list all deductions', async () => {
    await deductionsRepository.create({
      tenantId,
      employeeId: testEmployee1.id,
      name: 'Deduction 1',
      amount: 200,
      reason: 'Reason 1',
      date: new Date(),
    });

    await deductionsRepository.create({
      tenantId,
      employeeId: testEmployee2.id,
      name: 'Deduction 2',
      amount: 300,
      reason: 'Reason 2',
      date: new Date(),
    });

    const result = await sut.execute({ tenantId });

    expect(result.deductions).toHaveLength(2);
  });

  it('should filter deductions by employee', async () => {
    await deductionsRepository.create({
      tenantId,
      employeeId: testEmployee1.id,
      name: 'Deduction 1',
      amount: 200,
      reason: 'Reason 1',
      date: new Date(),
    });

    await deductionsRepository.create({
      tenantId,
      employeeId: testEmployee2.id,
      name: 'Deduction 2',
      amount: 300,
      reason: 'Reason 2',
      date: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee1.id.toString(),
    });

    expect(result.deductions).toHaveLength(1);
    expect(result.deductions[0].employeeId.equals(testEmployee1.id)).toBe(true);
  });

  it('should filter deductions by recurring status', async () => {
    await deductionsRepository.create({
      tenantId,
      employeeId: testEmployee1.id,
      name: 'One-time Deduction',
      amount: 200,
      reason: 'Reason 1',
      date: new Date(),
      isRecurring: false,
    });

    await deductionsRepository.create({
      tenantId,
      employeeId: testEmployee1.id,
      name: 'Recurring Deduction',
      amount: 300,
      reason: 'Reason 2',
      date: new Date(),
      isRecurring: true,
      installments: 6,
    });

    const recurringResult = await sut.execute({ tenantId, isRecurring: true });
    expect(recurringResult.deductions).toHaveLength(1);
    expect(recurringResult.deductions[0].isRecurring).toBe(true);

    const oneTimeResult = await sut.execute({ tenantId, isRecurring: false });
    expect(oneTimeResult.deductions).toHaveLength(1);
    expect(oneTimeResult.deductions[0].isRecurring).toBe(false);
  });

  it('should return empty array when no deductions exist', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.deductions).toHaveLength(0);
  });
});
