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
import { CreateDeductionUseCase } from './create-deduction';

let deductionsRepository: InMemoryDeductionsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CreateDeductionUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Create Deduction Use Case', () => {
  beforeEach(async () => {
    deductionsRepository = new InMemoryDeductionsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CreateDeductionUseCase(deductionsRepository, employeesRepository);

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

  it('should create a one-time deduction successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Advance Repayment',
      amount: 500,
      reason: 'Salary advance repayment',
      date: new Date(),
      isRecurring: false,
    });

    expect(result.deduction).toBeDefined();
    expect(result.deduction.name).toBe('Advance Repayment');
    expect(result.deduction.amount).toBe(500);
    expect(result.deduction.isRecurring).toBe(false);
    expect(result.deduction.isApplied).toBe(false);
  });

  it('should create a recurring deduction with installments', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Loan Payment',
      amount: 300,
      reason: 'Personal loan installment',
      date: new Date(),
      isRecurring: true,
      installments: 12,
    });

    expect(result.deduction).toBeDefined();
    expect(result.deduction.isRecurring).toBe(true);
    expect(result.deduction.installments).toBe(12);
    expect(result.deduction.currentInstallment).toBe(0);
  });

  it('should throw error if employee not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        name: 'Deduction',
        amount: 500,
        reason: 'Reason',
        date: new Date(),
      }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should create deduction for inactive employee', async () => {
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

    // Deduction can be created for inactive employees (e.g., final settlements)
    const result = await sut.execute({
      tenantId,
      employeeId: inactiveEmployee.id.toString(),
      name: 'Deduction',
      amount: 500,
      reason: 'Reason',
      date: new Date(),
    });

    expect(result.deduction).toBeDefined();
  });

  it('should create multiple deductions for the same employee', async () => {
    await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Deduction 1',
      amount: 200,
      reason: 'Reason 1',
      date: new Date(),
    });

    await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Deduction 2',
      amount: 300,
      reason: 'Reason 2',
      date: new Date(),
    });

    const deductions = await deductionsRepository.findManyByEmployee(
      testEmployee.id,
      tenantId,
    );
    expect(deductions).toHaveLength(2);
  });
});
