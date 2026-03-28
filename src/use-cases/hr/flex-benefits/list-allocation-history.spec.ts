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
import { ListAllocationHistoryUseCase } from './list-allocation-history';

let flexBenefitAllocationsRepository: InMemoryFlexBenefitAllocationsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ListAllocationHistoryUseCase;
let testEmployee: Employee;
let secondEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('List Allocation History Use Case', () => {
  beforeEach(async () => {
    flexBenefitAllocationsRepository =
      new InMemoryFlexBenefitAllocationsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ListAllocationHistoryUseCase(flexBenefitAllocationsRepository);

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

    secondEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Ana Silva',
      cpf: CPF.create('987.654.321-00'),
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 6000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should list all allocations for a tenant', async () => {
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 1,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600, VA: 400 },
    });
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 2,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 700, VA: 300 },
    });
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: secondEmployee.id,
      month: 1,
      year: 2024,
      totalBudget: 800,
      allocations: { VR: 500, VA: 300 },
    });

    const result = await sut.execute({ tenantId });

    expect(result.allocations).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('should return empty list when no allocations exist', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.allocations).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should filter by employeeId', async () => {
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 1,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600 },
    });
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: secondEmployee.id,
      month: 1,
      year: 2024,
      totalBudget: 800,
      allocations: { VR: 500 },
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].employeeId.equals(testEmployee.id)).toBe(true);
  });

  it('should filter by month', async () => {
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 1,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600 },
    });
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 2,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 700 },
    });

    const result = await sut.execute({ tenantId, month: 1 });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].month).toBe(1);
  });

  it('should filter by year', async () => {
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 6,
      year: 2023,
      totalBudget: 900,
      allocations: { VR: 500 },
    });
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 6,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600 },
    });

    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].year).toBe(2024);
  });

  it('should filter by status', async () => {
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 1,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600 },
      status: 'DRAFT',
    });
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 2,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 700 },
      status: 'CONFIRMED',
    });

    const draftResult = await sut.execute({ tenantId, status: 'DRAFT' });
    expect(draftResult.allocations).toHaveLength(1);
    expect(draftResult.allocations[0].status).toBe('DRAFT');

    const confirmedResult = await sut.execute({
      tenantId,
      status: 'CONFIRMED',
    });
    expect(confirmedResult.allocations).toHaveLength(1);
    expect(confirmedResult.allocations[0].status).toBe('CONFIRMED');
  });

  it('should paginate results', async () => {
    for (let month = 1; month <= 5; month++) {
      await flexBenefitAllocationsRepository.create({
        tenantId,
        employeeId: testEmployee.id,
        month,
        year: 2024,
        totalBudget: 1000,
        allocations: { VR: 600 },
      });
    }

    const firstPage = await sut.execute({ tenantId, page: 1, perPage: 2 });
    expect(firstPage.allocations).toHaveLength(2);
    expect(firstPage.total).toBe(5);

    const secondPage = await sut.execute({ tenantId, page: 2, perPage: 2 });
    expect(secondPage.allocations).toHaveLength(2);

    const thirdPage = await sut.execute({ tenantId, page: 3, perPage: 2 });
    expect(thirdPage.allocations).toHaveLength(1);
  });

  it('should not list allocations from other tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();

    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 1,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600 },
    });
    await flexBenefitAllocationsRepository.create({
      tenantId: otherTenantId,
      employeeId: new UniqueEntityID(),
      month: 1,
      year: 2024,
      totalBudget: 800,
      allocations: { VR: 500 },
    });

    const result = await sut.execute({ tenantId });

    expect(result.allocations).toHaveLength(1);
  });

  it('should combine multiple filters', async () => {
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 3,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600 },
      status: 'CONFIRMED',
    });
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 3,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600 },
      status: 'DRAFT',
    });
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: secondEmployee.id,
      month: 3,
      year: 2024,
      totalBudget: 800,
      allocations: { VR: 500 },
      status: 'CONFIRMED',
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      month: 3,
      year: 2024,
      status: 'CONFIRMED',
    });

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].employeeId.equals(testEmployee.id)).toBe(true);
    expect(result.allocations[0].status).toBe('CONFIRMED');
  });

  it('should sort allocations by year then month descending', async () => {
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 1,
      year: 2024,
      totalBudget: 1000,
      allocations: { VR: 600 },
    });
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 6,
      year: 2023,
      totalBudget: 900,
      allocations: { VR: 500 },
    });
    await flexBenefitAllocationsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      month: 3,
      year: 2024,
      totalBudget: 1100,
      allocations: { VR: 700 },
    });

    const result = await sut.execute({ tenantId });

    expect(result.allocations).toHaveLength(3);
    // Sorted descending: 2024/3, 2024/1, 2023/6
    expect(result.allocations[0].month).toBe(3);
    expect(result.allocations[0].year).toBe(2024);
    expect(result.allocations[1].month).toBe(1);
    expect(result.allocations[1].year).toBe(2024);
    expect(result.allocations[2].month).toBe(6);
    expect(result.allocations[2].year).toBe(2023);
  });
});
