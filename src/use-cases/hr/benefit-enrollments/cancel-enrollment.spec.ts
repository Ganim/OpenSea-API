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
import { CancelEnrollmentUseCase } from './cancel-enrollment';

let benefitEnrollmentsRepository: InMemoryBenefitEnrollmentsRepository;
let benefitPlansRepository: InMemoryBenefitPlansRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CancelEnrollmentUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Cancel Enrollment Use Case', () => {
  beforeEach(async () => {
    benefitEnrollmentsRepository = new InMemoryBenefitEnrollmentsRepository();
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CancelEnrollmentUseCase(benefitEnrollmentsRepository);

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

  it('should cancel an active enrollment', async () => {
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

    expect(enrollment.status).toBe('ACTIVE');

    const result = await sut.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
    });

    expect(result.enrollment.status).toBe('CANCELLED');
    expect(result.enrollment.endDate).toBeDefined();
  });

  it('should throw error for non-existent enrollment', async () => {
    await expect(
      sut.execute({
        tenantId,
        enrollmentId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Inscrição de benefício não encontrada');
  });

  it('should throw error when cancelling an already cancelled enrollment', async () => {
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
      }),
    ).rejects.toThrow('Esta inscrição já está cancelada');
  });

  it('should not cancel enrollment from a different tenant', async () => {
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
      }),
    ).rejects.toThrow('Inscrição de benefício não encontrada');
  });

  it('should set endDate to current date when cancelling', async () => {
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

    const beforeCancel = new Date();
    const result = await sut.execute({
      tenantId,
      enrollmentId: enrollment.id.toString(),
    });
    const afterCancel = new Date();

    expect(result.enrollment.endDate).toBeDefined();
    expect(result.enrollment.endDate!.getTime()).toBeGreaterThanOrEqual(
      beforeCancel.getTime(),
    );
    expect(result.enrollment.endDate!.getTime()).toBeLessThanOrEqual(
      afterCancel.getTime(),
    );
  });

  it('should return the cancelled enrollment with all data intact', async () => {
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
    });

    expect(result.enrollment.employeeContribution).toBe(200);
    expect(result.enrollment.employerContribution).toBe(500);
    expect(result.enrollment.employeeId.equals(testEmployee.id)).toBe(true);
    expect(result.enrollment.benefitPlanId.equals(healthPlan.id)).toBe(true);
  });
});
