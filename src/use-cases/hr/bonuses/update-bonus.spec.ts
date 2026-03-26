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
import { CreateBonusUseCase } from './create-bonus';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateBonusUseCase } from './update-bonus';

let bonusesRepository: InMemoryBonusesRepository;
let employeesRepository: InMemoryEmployeesRepository;
let createBonusUseCase: CreateBonusUseCase;
let sut: UpdateBonusUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Update Bonus Use Case', () => {
  beforeEach(async () => {
    bonusesRepository = new InMemoryBonusesRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    createBonusUseCase = new CreateBonusUseCase(
      bonusesRepository,
      employeesRepository,
    );
    sut = new UpdateBonusUseCase(bonusesRepository);

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

  it('should update a bonus name successfully', async () => {
    const { bonus: createdBonus } = await createBonusUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Original Bonus',
      amount: 1000,
      reason: 'Original reason',
      date: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      bonusId: createdBonus.id.toString(),
      name: 'Updated Bonus Name',
    });

    expect(result.bonus.name).toBe('Updated Bonus Name');
    expect(result.bonus.amount).toBe(1000);
    expect(result.bonus.reason).toBe('Original reason');
  });

  it('should update a bonus amount successfully', async () => {
    const { bonus: createdBonus } = await createBonusUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent performance',
      date: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      bonusId: createdBonus.id.toString(),
      amount: 2000,
    });

    expect(result.bonus.amount).toBe(2000);
    expect(result.bonus.name).toBe('Performance Bonus');
  });

  it('should update a bonus reason successfully', async () => {
    const { bonus: createdBonus } = await createBonusUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Original reason',
      date: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      bonusId: createdBonus.id.toString(),
      reason: 'Updated reason for bonus',
    });

    expect(result.bonus.reason).toBe('Updated reason for bonus');
  });

  it('should update multiple fields at once', async () => {
    const { bonus: createdBonus } = await createBonusUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Original Bonus',
      amount: 1000,
      reason: 'Original reason',
      date: new Date('2024-01-01'),
    });

    const newDate = new Date('2024-06-15');
    const result = await sut.execute({
      tenantId,
      bonusId: createdBonus.id.toString(),
      name: 'Updated Bonus',
      amount: 2500,
      reason: 'Updated reason',
      date: newDate,
    });

    expect(result.bonus.name).toBe('Updated Bonus');
    expect(result.bonus.amount).toBe(2500);
    expect(result.bonus.reason).toBe('Updated reason');
  });

  it('should throw error if bonus not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        bonusId: new UniqueEntityID().toString(),
        name: 'Updated Bonus',
      }),
    ).rejects.toThrow('Bônus não encontrado');
  });

  it('should throw error if bonus is already paid', async () => {
    const { bonus: createdBonus } = await createBonusUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Paid Bonus',
      amount: 1000,
      reason: 'Performance bonus',
      date: new Date(),
    });

    // Mark the bonus as paid
    createdBonus.markAsPaid();
    await bonusesRepository.save(createdBonus);

    await expect(
      sut.execute({
        tenantId,
        bonusId: createdBonus.id.toString(),
        name: 'Updated Name',
      }),
    ).rejects.toThrow('Não é possível editar um bônus já pago');
  });

  it('should throw error if amount is zero or negative', async () => {
    const { bonus: createdBonus } = await createBonusUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent performance',
      date: new Date(),
    });

    await expect(
      sut.execute({
        tenantId,
        bonusId: createdBonus.id.toString(),
        amount: 0,
      }),
    ).rejects.toThrow('O valor do bônus deve ser maior que zero');

    await expect(
      sut.execute({
        tenantId,
        bonusId: createdBonus.id.toString(),
        amount: -100,
      }),
    ).rejects.toThrow('O valor do bônus deve ser maior que zero');
  });

  it('should throw error if name is empty', async () => {
    const { bonus: createdBonus } = await createBonusUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent performance',
      date: new Date(),
    });

    await expect(
      sut.execute({
        tenantId,
        bonusId: createdBonus.id.toString(),
        name: '',
      }),
    ).rejects.toThrow('O nome do bônus é obrigatório');

    await expect(
      sut.execute({
        tenantId,
        bonusId: createdBonus.id.toString(),
        name: '   ',
      }),
    ).rejects.toThrow('O nome do bônus é obrigatório');
  });

  it('should throw error if reason is empty', async () => {
    const { bonus: createdBonus } = await createBonusUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent performance',
      date: new Date(),
    });

    await expect(
      sut.execute({
        tenantId,
        bonusId: createdBonus.id.toString(),
        reason: '',
      }),
    ).rejects.toThrow('O motivo do bônus é obrigatório');
  });

  it('should trim name and reason on update', async () => {
    const { bonus: createdBonus } = await createBonusUseCase.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent performance',
      date: new Date(),
    });

    const result = await sut.execute({
      tenantId,
      bonusId: createdBonus.id.toString(),
      name: '  Trimmed Name  ',
      reason: '  Trimmed Reason  ',
    });

    expect(result.bonus.name).toBe('Trimmed Name');
    expect(result.bonus.reason).toBe('Trimmed Reason');
  });
});
