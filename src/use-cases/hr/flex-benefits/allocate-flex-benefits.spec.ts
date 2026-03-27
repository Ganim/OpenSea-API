import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryFlexBenefitAllocationsRepository } from '@/repositories/hr/in-memory/in-memory-flex-benefit-allocations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AllocateFlexBenefitsUseCase } from './allocate-flex-benefits';

let flexBenefitAllocationsRepository: InMemoryFlexBenefitAllocationsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: AllocateFlexBenefitsUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Allocate Flex Benefits Use Case', () => {
  beforeEach(async () => {
    flexBenefitAllocationsRepository =
      new InMemoryFlexBenefitAllocationsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new AllocateFlexBenefitsUseCase(
      flexBenefitAllocationsRepository,
      employeesRepository,
    );

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Carlos Ferreira',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 8000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should allocate flex benefits successfully', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 3,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600, VA: 200, HOME_OFFICE: 200 },
    });

    expect(result.allocation).toBeDefined();
    expect(result.allocation.totalBudget).toBe(1000);
    expect(result.allocation.allocations).toEqual({
      VR: 600,
      VA: 200,
      HOME_OFFICE: 200,
    });
    expect(result.allocation.status).toBe('DRAFT');
    expect(result.allocation.allocatedTotal).toBe(1000);
    expect(result.allocation.remainingBudget).toBe(0);
  });

  it('should create a confirmed allocation when confirm flag is true', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 4,
      year: 2024,
      totalBudget: 500,
      allocations: { VR: 300, VA: 200 },
      confirm: true,
    });

    expect(result.allocation.status).toBe('CONFIRMED');
    expect(result.allocation.confirmedAt).toBeDefined();
  });

  it('should allow partial allocation (remaining budget)', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 5,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 400 },
    });

    expect(result.allocation.allocatedTotal).toBe(400);
    expect(result.allocation.remainingBudget).toBe(600);
  });

  it('should throw error when allocations exceed budget', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        month: 6,
        year: 2024,
        totalBudget: 500,
        allocations: { VR: 400, VA: 200 },
      }),
    ).rejects.toThrow('excede o orçamento disponível');
  });

  it('should throw error for negative allocation', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        month: 7,
        year: 2024,
        totalBudget: 1000,
        allocations: { VR: -100 },
      }),
    ).rejects.toThrow('não pode ser negativa');
  });

  it('should throw error for invalid month', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        month: 13,
        year: 2024,
        totalBudget: 1000,
        allocations: { VR: 500 },
      }),
    ).rejects.toThrow('Mês inválido');
  });

  it('should throw error for non-existent employee', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        month: 3,
        year: 2024,
        totalBudget: 1000,
        allocations: { VR: 500 },
      }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should update existing draft allocation', async () => {
    // Create initial allocation
    await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 8,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 500, VA: 500 },
    });

    // Update it
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 8,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 700, VA: 300 },
    });

    expect(result.allocation.allocations).toEqual({ VR: 700, VA: 300 });
    // Should still have only 1 item (updated, not duplicated)
    expect(flexBenefitAllocationsRepository.items).toHaveLength(1);
  });

  it('should throw error when updating a locked allocation', async () => {
    // Create and lock allocation
    const { allocation } = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 9,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 500 },
    });

    allocation.lock();

    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        month: 9,
        year: 2024,
        totalBudget: 1000,
        allocations: { VR: 700 },
      }),
    ).rejects.toThrow('já está bloqueada');
  });

  it('should throw error for zero budget', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        month: 10,
        year: 2024,
        totalBudget: 0,
        allocations: {},
      }),
    ).rejects.toThrow('O orçamento total deve ser maior que zero');
  });
});
