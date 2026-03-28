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
import { UpdateEnrollmentUseCase } from './update-enrollment';

let benefitEnrollmentsRepository: InMemoryBenefitEnrollmentsRepository;
let benefitPlansRepository: InMemoryBenefitPlansRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: UpdateEnrollmentUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Update Enrollment Use Case', () => {
  beforeEach(async () => {
    benefitEnrollmentsRepository = new InMemoryBenefitEnrollmentsRepository();
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new UpdateEnrollmentUseCase(benefitEnrollmentsRepository);

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
  });

  it('should update enrollment contributions', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const enrollment = await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
      employeeContribution: 200,
      employerContribution: 500,
    });

    const result = await sut.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
      employeeContribution: 300,
      employerContribution: 600,
    });

    expect(result.enrollment.employeeContribution).toBe(300);
    expect(result.enrollment.employerContribution).toBe(600);
  });

  it('should update enrollment dates', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const enrollment = await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    const newEndDate = new Date('2025-12-31');
    const result = await sut.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
      endDate: newEndDate,
    });

    expect(result.enrollment.endDate).toEqual(newEndDate);
  });

  it('should update dependant ids', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Familiar',
      type: 'HEALTH',
    });

    const enrollment = await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    const dependantId1 = new UniqueEntityID().toString();
    const dependantId2 = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
      dependantIds: [dependantId1, dependantId2],
    });

    expect(result.enrollment.dependantIds).toEqual([
      dependantId1,
      dependantId2,
    ]);
  });

  it('should update metadata', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const enrollment = await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    const result = await sut.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
      metadata: { cardNumber: '12345678', planLevel: 'premium' },
    });

    expect(result.enrollment.metadata).toEqual({
      cardNumber: '12345678',
      planLevel: 'premium',
    });
  });

  it('should throw error for non-existent enrollment', async () => {
    await expect(
      sut.execute({
        tenantId,
        enrollmentId: new UniqueEntityID().toString(),
        employeeContribution: 300,
      }),
    ).rejects.toThrow('Inscrição de benefício não encontrada');
  });

  it('should throw error when updating a cancelled enrollment', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const enrollment = await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
      status: 'CANCELLED',
    });

    await expect(
      sut.execute({
        tenantId,
        enrollmentId: enrollment.id.toString(),
        employeeContribution: 300,
      }),
    ).rejects.toThrow('Não é possível atualizar uma inscrição cancelada');
  });

  it('should throw error for negative employee contribution', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const enrollment = await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    await expect(
      sut.execute({
        tenantId,
        enrollmentId: enrollment.id.toString(),
        employeeContribution: -50,
      }),
    ).rejects.toThrow('A contribuição do funcionário não pode ser negativa');
  });

  it('should throw error for negative employer contribution', async () => {
    const healthPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const enrollment = await benefitEnrollmentsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    await expect(
      sut.execute({
        tenantId,
        enrollmentId: enrollment.id.toString(),
        employerContribution: -100,
      }),
    ).rejects.toThrow('A contribuição da empresa não pode ser negativa');
  });

  it('should not update enrollment from a different tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const healthPlan = await benefitPlansRepository.create({
      tenantId: otherTenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const enrollment = await benefitEnrollmentsRepository.create({
      tenantId: otherTenantId,
      employeeId: testEmployee.id,
      benefitPlanId: healthPlan.id,
      startDate: new Date('2024-01-01'),
    });

    await expect(
      sut.execute({
        tenantId,
        enrollmentId: enrollment.id.toString(),
        employeeContribution: 300,
      }),
    ).rejects.toThrow('Inscrição de benefício não encontrada');
  });
});
