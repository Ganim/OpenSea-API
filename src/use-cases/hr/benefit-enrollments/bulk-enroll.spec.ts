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
import { BulkEnrollUseCase } from './bulk-enroll';

let benefitEnrollmentsRepository: InMemoryBenefitEnrollmentsRepository;
let benefitPlansRepository: InMemoryBenefitPlansRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: BulkEnrollUseCase;
let employeeOne: Employee;
let employeeTwo: Employee;
let employeeThree: Employee;

const tenantId = new UniqueEntityID().toString();

async function createTestEmployee(
  registrationNumber: string,
  fullName: string,
): Promise<Employee> {
  return employeesRepository.create({
    tenantId,
    registrationNumber,
    fullName,
    cpf: CPF.create('529.982.247-25'),
    hireDate: new Date('2022-01-01'),
    status: EmployeeStatus.ACTIVE(),
    baseSalary: 5000,
    contractType: ContractType.CLT(),
    workRegime: WorkRegime.FULL_TIME(),
    weeklyHours: 44,
    country: 'Brasil',
  });
}

describe('Bulk Enroll Use Case', () => {
  beforeEach(async () => {
    benefitEnrollmentsRepository = new InMemoryBenefitEnrollmentsRepository();
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new BulkEnrollUseCase(
      benefitEnrollmentsRepository,
      benefitPlansRepository,
      employeesRepository,
    );

    employeeOne = await createTestEmployee('EMP001', 'Maria Santos');
    employeeTwo = await createTestEmployee('EMP002', 'João Pereira');
    employeeThree = await createTestEmployee('EMP003', 'Ana Silva');
  });

  it('should bulk enroll multiple employees successfully', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: healthPlan.id.toString(),
      employeeIds: [
        employeeOne.id.toString(),
        employeeTwo.id.toString(),
        employeeThree.id.toString(),
      ],
      startDate: new Date('2024-01-01'),
      employeeContribution: 200,
      employerContribution: 500,
    });

    expect(result.enrollments).toHaveLength(3);
    expect(result.failedEmployeeIds).toHaveLength(0);
    expect(benefitEnrollmentsRepository.items).toHaveLength(3);
  });

  it('should throw error for empty employee list', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    await expect(
      sut.execute({
        tenantId,
        benefitPlanId: healthPlan.id.toString(),
        employeeIds: [],
        startDate: new Date('2024-01-01'),
      }),
    ).rejects.toThrow('É necessário informar pelo menos um funcionário');
  });

  it('should throw error for non-existent benefit plan', async () => {
    await expect(
      sut.execute({
        tenantId,
        benefitPlanId: new UniqueEntityID().toString(),
        employeeIds: [employeeOne.id.toString()],
        startDate: new Date('2024-01-01'),
      }),
    ).rejects.toThrow('Plano de benefício não encontrado');
  });

  it('should throw error for inactive benefit plan', async () => {
    const inactivePlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Inativo',
      type: 'HEALTH',
      isActive: false,
    });

    await expect(
      sut.execute({
        tenantId,
        benefitPlanId: inactivePlan.id.toString(),
        employeeIds: [employeeOne.id.toString()],
        startDate: new Date('2024-01-01'),
      }),
    ).rejects.toThrow(
      'Não é possível inscrever em um plano de benefício inativo',
    );
  });

  it('should skip non-existent employees and report them as failed', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const nonExistentId = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId,
      benefitPlanId: healthPlan.id.toString(),
      employeeIds: [
        employeeOne.id.toString(),
        nonExistentId,
        employeeTwo.id.toString(),
      ],
      startDate: new Date('2024-01-01'),
    });

    expect(result.enrollments).toHaveLength(2);
    expect(result.failedEmployeeIds).toHaveLength(1);
    expect(result.failedEmployeeIds).toContain(nonExistentId);
  });

  it('should skip already enrolled employees and report them as failed', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    // Pre-enroll employeeOne
    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: employeeOne.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: healthPlan.id.toString(),
      employeeIds: [
        employeeOne.id.toString(),
        employeeTwo.id.toString(),
        employeeThree.id.toString(),
      ],
      startDate: new Date('2024-02-01'),
    });

    expect(result.enrollments).toHaveLength(2);
    expect(result.failedEmployeeIds).toHaveLength(1);
    expect(result.failedEmployeeIds).toContain(employeeOne.id.toString());
  });

  it('should handle all employees failing', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const nonExistentId1 = new UniqueEntityID().toString();
    const nonExistentId2 = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId,
      benefitPlanId: healthPlan.id.toString(),
      employeeIds: [nonExistentId1, nonExistentId2],
      startDate: new Date('2024-01-01'),
    });

    expect(result.enrollments).toHaveLength(0);
    expect(result.failedEmployeeIds).toHaveLength(2);
  });

  it('should set contributions on all enrollments', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const result = await sut.execute({
      tenantId,
      benefitPlanId: healthPlan.id.toString(),
      employeeIds: [employeeOne.id.toString(), employeeTwo.id.toString()],
      startDate: new Date('2024-01-01'),
      employeeContribution: 150,
      employerContribution: 350,
    });

    for (const enrollment of result.enrollments) {
      expect(enrollment.employeeContribution).toBe(150);
      expect(enrollment.employerContribution).toBe(350);
    }
  });

  it('should set end date on all enrollments when provided', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const endDate = new Date('2024-12-31');

    const result = await sut.execute({
      tenantId,
      benefitPlanId: healthPlan.id.toString(),
      employeeIds: [employeeOne.id.toString(), employeeTwo.id.toString()],
      startDate: new Date('2024-01-01'),
      endDate,
    });

    for (const enrollment of result.enrollments) {
      expect(enrollment.endDate).toEqual(endDate);
    }
  });

  it('should handle mix of non-existent and already enrolled employees', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    // Pre-enroll employeeOne
    await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: employeeOne.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    const nonExistentId = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId,
      benefitPlanId: healthPlan.id.toString(),
      employeeIds: [
        employeeOne.id.toString(),
        nonExistentId,
        employeeTwo.id.toString(),
      ],
      startDate: new Date('2024-02-01'),
    });

    expect(result.enrollments).toHaveLength(1);
    expect(result.failedEmployeeIds).toHaveLength(2);
    expect(result.failedEmployeeIds).toContain(employeeOne.id.toString());
    expect(result.failedEmployeeIds).toContain(nonExistentId);
  });
});
