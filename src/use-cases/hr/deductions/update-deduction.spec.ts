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
import { CreateDeductionUseCase } from './create-deduction';
import { UpdateDeductionUseCase } from './update-deduction';
import { beforeEach, describe, expect, it } from 'vitest';

let deductionsRepository: InMemoryDeductionsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let createDeductionUseCase: CreateDeductionUseCase;
let sut: UpdateDeductionUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Update Deduction Use Case', () => {
  beforeEach(async () => {
    deductionsRepository = new InMemoryDeductionsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    createDeductionUseCase = new CreateDeductionUseCase(
      deductionsRepository,
      employeesRepository,
    );
    sut = new UpdateDeductionUseCase(deductionsRepository);

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

  it('should update deduction name successfully', async () => {
    const { deduction: createdDeduction } =
      await createDeductionUseCase.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: 'Original Name',
        amount: 500,
        reason: 'Original reason for deduction',
        date: new Date(),
      });

    const { deduction } = await sut.execute({
      tenantId,
      deductionId: createdDeduction.id.toString(),
      name: 'Updated Name',
    });

    expect(deduction.name).toBe('Updated Name');
    expect(deduction.amount).toBe(500);
  });

  it('should update deduction amount successfully', async () => {
    const { deduction: createdDeduction } =
      await createDeductionUseCase.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: 'Advance Repayment',
        amount: 500,
        reason: 'Salary advance repayment',
        date: new Date(),
      });

    const { deduction } = await sut.execute({
      tenantId,
      deductionId: createdDeduction.id.toString(),
      amount: 750,
    });

    expect(deduction.amount).toBe(750);
    expect(deduction.name).toBe('Advance Repayment');
  });

  it('should update deduction reason successfully', async () => {
    const { deduction: createdDeduction } =
      await createDeductionUseCase.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: 'Loan Payment',
        amount: 300,
        reason: 'Personal loan installment',
        date: new Date(),
      });

    const { deduction } = await sut.execute({
      tenantId,
      deductionId: createdDeduction.id.toString(),
      reason: 'Updated loan reason description',
    });

    expect(deduction.reason).toBe('Updated loan reason description');
  });

  it('should update multiple fields at once', async () => {
    const { deduction: createdDeduction } =
      await createDeductionUseCase.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: 'Old Name',
        amount: 200,
        reason: 'Old reason for deduction',
        date: new Date('2024-01-01'),
        isRecurring: false,
      });

    const newDate = new Date('2024-06-01');
    const { deduction } = await sut.execute({
      tenantId,
      deductionId: createdDeduction.id.toString(),
      name: 'New Name',
      amount: 400,
      reason: 'New reason for deduction',
      date: newDate,
      isRecurring: true,
      installments: 6,
    });

    expect(deduction.name).toBe('New Name');
    expect(deduction.amount).toBe(400);
    expect(deduction.reason).toBe('New reason for deduction');
  });

  it('should throw error if deduction not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        deductionId: new UniqueEntityID().toString(),
        name: 'Updated Name',
      }),
    ).rejects.toThrow('Dedução não encontrada');
  });

  it('should throw error if amount is zero or negative', async () => {
    const { deduction: createdDeduction } =
      await createDeductionUseCase.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: 'Test Deduction',
        amount: 500,
        reason: 'Test reason for deduction',
        date: new Date(),
      });

    await expect(
      sut.execute({
        tenantId,
        deductionId: createdDeduction.id.toString(),
        amount: 0,
      }),
    ).rejects.toThrow('O valor da dedução deve ser maior que zero');

    await expect(
      sut.execute({
        tenantId,
        deductionId: createdDeduction.id.toString(),
        amount: -100,
      }),
    ).rejects.toThrow('O valor da dedução deve ser maior que zero');
  });

  it('should throw error if name is empty', async () => {
    const { deduction: createdDeduction } =
      await createDeductionUseCase.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: 'Test Deduction',
        amount: 500,
        reason: 'Test reason for deduction',
        date: new Date(),
      });

    await expect(
      sut.execute({
        tenantId,
        deductionId: createdDeduction.id.toString(),
        name: '',
      }),
    ).rejects.toThrow('O nome da dedução é obrigatório');
  });

  it('should throw error if reason is empty', async () => {
    const { deduction: createdDeduction } =
      await createDeductionUseCase.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: 'Test Deduction',
        amount: 500,
        reason: 'Test reason for deduction',
        date: new Date(),
      });

    await expect(
      sut.execute({
        tenantId,
        deductionId: createdDeduction.id.toString(),
        reason: '',
      }),
    ).rejects.toThrow('O motivo da dedução é obrigatório');
  });

  it('should throw error when updating applied non-recurring deduction', async () => {
    const { deduction: createdDeduction } =
      await createDeductionUseCase.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: 'Applied Deduction',
        amount: 500,
        reason: 'Applied deduction reason',
        date: new Date(),
        isRecurring: false,
      });

    // Mark as applied
    createdDeduction.markAsApplied();

    await expect(
      sut.execute({
        tenantId,
        deductionId: createdDeduction.id.toString(),
        name: 'Updated Name',
      }),
    ).rejects.toThrow('Não é possível editar uma dedução já aplicada');
  });

  it('should throw error if installments is less than 1', async () => {
    const { deduction: createdDeduction } =
      await createDeductionUseCase.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        name: 'Test Deduction',
        amount: 500,
        reason: 'Test reason for deduction',
        date: new Date(),
      });

    await expect(
      sut.execute({
        tenantId,
        deductionId: createdDeduction.id.toString(),
        installments: 0,
      }),
    ).rejects.toThrow('O número de parcelas deve ser pelo menos 1');
  });
});
