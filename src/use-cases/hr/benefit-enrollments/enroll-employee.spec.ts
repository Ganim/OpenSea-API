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
import { EnrollEmployeeUseCase } from './enroll-employee';

let benefitEnrollmentsRepository: InMemoryBenefitEnrollmentsRepository;
let benefitPlansRepository: InMemoryBenefitPlansRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: EnrollEmployeeUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Enroll Employee Use Case', () => {
  beforeEach(async () => {
    benefitEnrollmentsRepository = new InMemoryBenefitEnrollmentsRepository();
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new EnrollEmployeeUseCase(
      benefitEnrollmentsRepository,
      benefitPlansRepository,
      employeesRepository,
    );

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

  it('should enroll an employee in a benefit plan successfully', async () => {
    const benefitPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano de Saúde',
      type: 'HEALTH',
    });

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      benefitPlanId: benefitPlan.id.toString(),
      startDate: new Date('2024-01-01'),
      employeeContribution: 200,
      employerContribution: 500,
    });

    expect(result.enrollment).toBeDefined();
    expect(result.enrollment.status).toBe('ACTIVE');
    expect(result.enrollment.employeeContribution).toBe(200);
    expect(result.enrollment.employerContribution).toBe(500);
    expect(benefitEnrollmentsRepository.items).toHaveLength(1);
  });

  it('should throw error for non-existent employee', async () => {
    const benefitPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'VT',
      type: 'VT',
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: new UniqueEntityID().toString(),
        benefitPlanId: benefitPlan.id.toString(),
        startDate: new Date(),
      }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should throw error for non-existent benefit plan', async () => {
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        benefitPlanId: new UniqueEntityID().toString(),
        startDate: new Date(),
      }),
    ).rejects.toThrow('Plano de benefício não encontrado');
  });

  it('should throw error for inactive benefit plan', async () => {
    const benefitPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Inactive Plan',
      type: 'HEALTH',
      isActive: false,
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        benefitPlanId: benefitPlan.id.toString(),
        startDate: new Date(),
      }),
    ).rejects.toThrow(
      'Não é possível inscrever em um plano de benefício inativo',
    );
  });

  it('should throw error for duplicate enrollment', async () => {
    const benefitPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'VR',
      type: 'VR',
    });

    // First enrollment - should succeed
    await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      benefitPlanId: benefitPlan.id.toString(),
      startDate: new Date(),
    });

    // Second enrollment - should fail
    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        benefitPlanId: benefitPlan.id.toString(),
        startDate: new Date(),
      }),
    ).rejects.toThrow('Funcionário já está inscrito neste plano de benefício');
  });

  it('should throw error for negative employee contribution', async () => {
    const benefitPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Dental',
      type: 'DENTAL',
    });

    await expect(
      sut.execute({
        tenantId,
        employeeId: testEmployee.id.toString(),
        benefitPlanId: benefitPlan.id.toString(),
        startDate: new Date(),
        employeeContribution: -100,
      }),
    ).rejects.toThrow('A contribuição do funcionário não pode ser negativa');
  });

  it('should enroll with dependant ids', async () => {
    const benefitPlan = await benefitPlansRepository.create({
      tenantId,
      name: 'Plano Familiar',
      type: 'HEALTH',
    });

    const dependantId1 = new UniqueEntityID().toString();
    const dependantId2 = new UniqueEntityID().toString();

    const result = await sut.execute({
      tenantId,
      employeeId: testEmployee.id.toString(),
      benefitPlanId: benefitPlan.id.toString(),
      startDate: new Date(),
      dependantIds: [dependantId1, dependantId2],
    });

    expect(result.enrollment.dependantIds).toEqual([
      dependantId1,
      dependantId2,
    ]);
  });
});
