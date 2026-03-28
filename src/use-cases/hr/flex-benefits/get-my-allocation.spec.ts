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
import { GetMyAllocationUseCase } from './get-my-allocation';

let flexBenefitAllocationsRepository: InMemoryFlexBenefitAllocationsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: GetMyAllocationUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Get My Allocation Use Case', () => {
  beforeEach(async () => {
    flexBenefitAllocationsRepository =
      new InMemoryFlexBenefitAllocationsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GetMyAllocationUseCase(flexBenefitAllocationsRepository);

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

  it('should get allocation for a specific month and year', async () => {
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 3,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600, VA: 400 },
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 3,
      year: 2024,
    });

    expect(result.allocation).not.toBeNull();
    expect(result.allocation!.month).toBe(3);
    expect(result.allocation!.year).toBe(2024);
    expect(result.allocation!.totalBudget).toBe(1000);
    expect(result.allocation!.allocations).toEqual({ VR: 600, VA: 400 });
  });

  it('should return null when no allocation exists', async () => {
    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 6,
      year: 2024,
    });

    expect(result.allocation).toBeNull();
  });

  it('should default to current month and year when not specified', async () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: currentMonth,
      year: currentYear,
      totalBudget: 800,
      allocations: { VR: 500, VA: 300 },
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    expect(result.allocation).not.toBeNull();
    expect(result.allocation!.month).toBe(currentMonth);
    expect(result.allocation!.year).toBe(currentYear);
  });

  it('should not return allocation from a different employee', async () => {
    const otherEmployeeId = new UniqueEntityID();

    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: otherEmployeeId,
      month: 3,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600 },
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 3,
      year: 2024,
    });

    expect(result.allocation).toBeNull();
  });

  it('should not return allocation from a different tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    await flexBenefitAllocationsRepository.create({
      tenantId: otherTenantId,
      employeeId: testEmployee.id,
      month: 3,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600 },
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 3,
      year: 2024,
    });

    expect(result.allocation).toBeNull();
  });

  it('should return allocation with confirmed status', async () => {
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 4,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 500, VA: 500 },
      status: 'CONFIRMED',
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 4,
      year: 2024,
    });

    expect(result.allocation).not.toBeNull();
    expect(result.allocation!.status).toBe('CONFIRMED');
  });

  it('should distinguish allocations by month', async () => {
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 3,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600, VA: 400 },
    });

    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 4,
      year: 2024,
      totalBudget: 1200,
      allocations: { VR: 700, VA: 500 },
    });

    const marchResult = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 3,
      year: 2024,
    });

    const aprilResult = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 4,
      year: 2024,
    });

    expect(marchResult.allocation!.totalBudget).toBe(1000);
    expect(aprilResult.allocation!.totalBudget).toBe(1200);
  });
});
