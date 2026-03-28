import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryBenefitEnrollmentsRepository } from '@/repositories/hr/in-memory/in-memory-benefit-enrollments-repository';
import { InMemoryBenefitPlansRepository } from '@/repositories/hr/in-memory/in-memory-benefit-plans-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListEnrollmentsUseCase } from './list-enrollments';

let benefitEnrollmentsRepository: InMemoryBenefitEnrollmentsRepository;
let benefitPlansRepository: InMemoryBenefitPlansRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: ListEnrollmentsUseCase;
let testEmployee: Employee;
let secondEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('List Enrollments Use Case', () => {
  beforeEach(async () => {
    benefitEnrollmentsRepository = new InMemoryBenefitEnrollmentsRepository();
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new ListEnrollmentsUseCase(benefitEnrollmentsRepository);

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Maria Santos',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    secondEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'João Pereira',
      cpf: CPF.create('987.654.321-00'),
      hireDate: new Date('2023-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 4000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should list all enrollments for a tenant', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });
    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: secondEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    const result = await sut.execute({ tenantId });

    expect(result.enrollments).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should return empty list when no enrollments exist', async () => {
    const result = await sut.execute({ tenantId });

    expect(result.enrollments).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should filter by employeeId', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });
    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: secondEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
    });

    expect(result.enrollments).toHaveLength(1);
    expect(result.enrollments[0].employeeId.equals(testEmployee.id)).toBe(true);
  });

  it('should filter by benefitPlanId', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });
    const dentalPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Dental',
      type: 'DENTAL',
    });

    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });
    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: dentalPlan.id,
      startDate: new Date('2024-01-01'),
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: healthPlan.id.toString(),
    });

    expect(result.enrollments).toHaveLength(1);
    expect(result.enrollments[0].benefitPlanId.equals(healthPlan.id)).toBe(
      true,
    );
  });

  it('should filter by status', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
      status: 'ACTIVE',
    });
    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: secondEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
      status: 'CANCELLED',
    });

    const activeResult = await sut.execute({ tenantId, status: 'ACTIVE' });
    expect(activeResult.enrollments).toHaveLength(1);

    const cancelledResult = await sut.execute({
      tenantId,
      status: 'CANCELLED',
    });
    expect(cancelledResult.enrollments).toHaveLength(1);
  });

  it('should paginate results', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    for (let i = 0; i < 5; i++) {
      const employee = await employeesRepository.create({
        tenantId,
        registrationNumber: `EMP-PAG-${i}`,
        fullName: `Funcionário ${i}`,
        cpf: CPF.create('529.982.247-25'),
        hireDate: new Date('2022-01-01'),
        status: EmployeeStatus.ACTIVE(),
        baseSalary: 3000,
        contractType: ContractType.CLT(),
        workRegime: WorkRegime.FULL_TIME(),
        weeklyHours: 44,
        country: 'Brasil',
      });

      await benefitEnrollmentsRepository.create({
        tenantId,
        employeeId: employee.id,
        benefitPlanId: healthPlan.id,
        startDate: new Date('2024-01-01'),
      });
    }

    const firstPage = await sut.execute({ tenantId, page: 1, perPage: 2 });
    expect(firstPage.enrollments).toHaveLength(2);
    expect(firstPage.total).toBe(5);

    const secondPage = await sut.execute({ tenantId, page: 2, perPage: 2 });
    expect(secondPage.enrollments).toHaveLength(2);

    const thirdPage = await sut.execute({ tenantId, page: 3, perPage: 2 });
    expect(thirdPage.enrollments).toHaveLength(1);
  });

  it('should not list enrollments from other tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });
    await benefitEnrollmentsRepository.create({
      tenantId: otherTenantId,
      employeeId: new UniqueEntityID(),
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    const result = await sut.execute({ tenantId });

    expect(result.enrollments).toHaveLength(1);
  });
});
