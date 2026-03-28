import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BenefitEnrollment } from '@/entities/hr/benefit-enrollment';
import { BenefitPlan } from '@/entities/hr/benefit-plan';
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
import { CalculateBenefitDeductionsUseCase } from './calculate-benefit-deductions';

const TENANT_ID = 'tenant-1';

let benefitEnrollmentsRepository: InMemoryBenefitEnrollmentsRepository;
let benefitPlansRepository: InMemoryBenefitPlansRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CalculateBenefitDeductionsUseCase;

function createEmployee(
  overrides: { baseSalary?: number; id?: UniqueEntityID } = {},
): Employee {
  return Employee.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      registrationNumber: '001',
      fullName: 'João Silva',
      cpf: CPF.create('12345678909'),
      status: EmployeeStatus.create('ACTIVE'),
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      hireDate: new Date('2024-01-01'),
      country: 'BR',
      pcd: false,
      metadata: {},
      pendingIssues: [],
      baseSalary: overrides.baseSalary ?? 5000,
    },
    overrides.id ?? new UniqueEntityID(),
  );
}

function createBenefitPlan(
  overrides: {
    type?: string;
    name?: string;
    isActive?: boolean;
    id?: UniqueEntityID;
  } = {},
): BenefitPlan {
  return BenefitPlan.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      name: overrides.name ?? 'Benefit Plan',
      type: overrides.type ?? 'HEALTH',
      isActive: overrides.isActive ?? true,
    },
    overrides.id ?? new UniqueEntityID(),
  );
}

function createEnrollment(
  employeeId: UniqueEntityID,
  benefitPlanId: UniqueEntityID,
  overrides: {
    employeeContribution?: number;
    employerContribution?: number;
    status?: string;
  } = {},
): BenefitEnrollment {
  return BenefitEnrollment.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    employeeId,
    benefitPlanId,
    startDate: new Date('2024-01-01'),
    status: overrides.status ?? 'ACTIVE',
    employeeContribution: overrides.employeeContribution ?? 0,
    employerContribution: overrides.employerContribution ?? 0,
  });
}

describe('Calculate Benefit Deductions Use Case', () => {
  beforeEach(() => {
    benefitEnrollmentsRepository = new InMemoryBenefitEnrollmentsRepository();
    benefitPlansRepository = new InMemoryBenefitPlansRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new CalculateBenefitDeductionsUseCase(
      benefitEnrollmentsRepository,
      benefitPlansRepository,
      employeesRepository,
    );
  });

  it('should throw ResourceNotFoundError when employee does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        employeeId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Funcionário não encontrado');
  });

  it('should return empty deductions when employee has no active enrollments', async () => {
    const employee = createEmployee();
    employeesRepository['items'].push(employee);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    expect(result.employeeId).toBe(employee.id.toString());
    expect(result.baseSalary).toBe(5000);
    expect(result.deductions).toHaveLength(0);
    expect(result.totalEmployeeDeductions).toBe(0);
    expect(result.totalEmployerContributions).toBe(0);
  });

  it('should calculate VT deduction as 6% of base salary capped at benefit value', async () => {
    const employee = createEmployee({ baseSalary: 3000 });
    employeesRepository['items'].push(employee);

    const vtPlan = createBenefitPlan({ type: 'VT', name: 'Vale Transporte' });
    benefitPlansRepository.items.push(vtPlan);

    // Employee contribution (R$400) is higher than 6% of salary (R$180)
    const enrollment = createEnrollment(employee.id, vtPlan.id, {
      employeeContribution: 400,
      employerContribution: 200,
    });
    benefitEnrollmentsRepository.items.push(enrollment);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    expect(result.deductions).toHaveLength(1);
    // 6% of 3000 = 180, which is less than 400, so deduction should be 180
    expect(result.deductions[0].deductionAmount).toBe(180);
    expect(result.deductions[0].benefitType).toBe('VT');
    expect(result.totalEmployeeDeductions).toBe(180);
    expect(result.totalEmployerContributions).toBe(200);
  });

  it('should use employee contribution when VT 6% cap exceeds benefit value', async () => {
    const employee = createEmployee({ baseSalary: 10000 });
    employeesRepository['items'].push(employee);

    const vtPlan = createBenefitPlan({ type: 'VT', name: 'Vale Transporte' });
    benefitPlansRepository.items.push(vtPlan);

    // 6% of 10000 = 600, but employee contribution is only 200
    const enrollment = createEnrollment(employee.id, vtPlan.id, {
      employeeContribution: 200,
      employerContribution: 300,
    });
    benefitEnrollmentsRepository.items.push(enrollment);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    expect(result.deductions[0].deductionAmount).toBe(200);
  });

  it('should calculate HEALTH plan deduction using employee contribution', async () => {
    const employee = createEmployee();
    employeesRepository['items'].push(employee);

    const healthPlan = createBenefitPlan({
      type: 'HEALTH',
      name: 'Plano de Saúde Premium',
    });
    benefitPlansRepository.items.push(healthPlan);

    const enrollment = createEnrollment(employee.id, healthPlan.id, {
      employeeContribution: 350,
      employerContribution: 650,
    });
    benefitEnrollmentsRepository.items.push(enrollment);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    expect(result.deductions).toHaveLength(1);
    expect(result.deductions[0].deductionAmount).toBe(350);
    expect(result.deductions[0].description).toContain('Plano de Saúde');
  });

  it('should calculate DENTAL plan deduction using employee contribution', async () => {
    const employee = createEmployee();
    employeesRepository['items'].push(employee);

    const dentalPlan = createBenefitPlan({
      type: 'DENTAL',
      name: 'Odonto Plus',
    });
    benefitPlansRepository.items.push(dentalPlan);

    const enrollment = createEnrollment(employee.id, dentalPlan.id, {
      employeeContribution: 80,
      employerContribution: 120,
    });
    benefitEnrollmentsRepository.items.push(enrollment);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    expect(result.deductions[0].deductionAmount).toBe(80);
    expect(result.deductions[0].description).toContain('Plano Odontológico');
  });

  it('should calculate LIFE_INSURANCE deduction using employee contribution', async () => {
    const employee = createEmployee();
    employeesRepository['items'].push(employee);

    const lifePlan = createBenefitPlan({
      type: 'LIFE_INSURANCE',
      name: 'Seguro Vida Total',
    });
    benefitPlansRepository.items.push(lifePlan);

    const enrollment = createEnrollment(employee.id, lifePlan.id, {
      employeeContribution: 50,
      employerContribution: 100,
    });
    benefitEnrollmentsRepository.items.push(enrollment);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    expect(result.deductions[0].deductionAmount).toBe(50);
    expect(result.deductions[0].description).toContain('Seguro de Vida');
  });

  it('should handle unknown benefit types using employee contribution as fallback', async () => {
    const employee = createEmployee();
    employeesRepository['items'].push(employee);

    const customPlan = createBenefitPlan({
      type: 'CUSTOM_BENEFIT',
      name: 'Gym Pass',
    });
    benefitPlansRepository.items.push(customPlan);

    const enrollment = createEnrollment(employee.id, customPlan.id, {
      employeeContribution: 60,
      employerContribution: 40,
    });
    benefitEnrollmentsRepository.items.push(enrollment);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    expect(result.deductions[0].deductionAmount).toBe(60);
    expect(result.deductions[0].description).toContain('Gym Pass');
  });

  it('should aggregate multiple benefit deductions correctly', async () => {
    const employee = createEmployee({ baseSalary: 5000 });
    employeesRepository['items'].push(employee);

    const healthPlan = createBenefitPlan({ type: 'HEALTH', name: 'Saúde' });
    const dentalPlan = createBenefitPlan({ type: 'DENTAL', name: 'Odonto' });
    const vtPlan = createBenefitPlan({ type: 'VT', name: 'VT' });
    benefitPlansRepository.items.push(healthPlan, dentalPlan, vtPlan);

    const healthEnrollment = createEnrollment(employee.id, healthPlan.id, {
      employeeContribution: 200,
      employerContribution: 500,
    });
    const dentalEnrollment = createEnrollment(employee.id, dentalPlan.id, {
      employeeContribution: 50,
      employerContribution: 100,
    });
    // VT: 6% of 5000 = 300, capped at 250
    const vtEnrollment = createEnrollment(employee.id, vtPlan.id, {
      employeeContribution: 250,
      employerContribution: 150,
    });
    benefitEnrollmentsRepository.items.push(
      healthEnrollment,
      dentalEnrollment,
      vtEnrollment,
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    expect(result.deductions).toHaveLength(3);
    // Health: 200, Dental: 50, VT: min(300, 250) = 250
    expect(result.totalEmployeeDeductions).toBe(200 + 50 + 250);
    expect(result.totalEmployerContributions).toBe(500 + 100 + 150);
  });

  it('should skip inactive benefit plans', async () => {
    const employee = createEmployee();
    employeesRepository['items'].push(employee);

    const inactivePlan = createBenefitPlan({
      type: 'HEALTH',
      name: 'Inactive Plan',
      isActive: false,
    });
    benefitPlansRepository.items.push(inactivePlan);

    const enrollment = createEnrollment(employee.id, inactivePlan.id, {
      employeeContribution: 300,
      employerContribution: 700,
    });
    benefitEnrollmentsRepository.items.push(enrollment);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    expect(result.deductions).toHaveLength(0);
    expect(result.totalEmployeeDeductions).toBe(0);
  });

  it('should handle employee with zero base salary for VT calculation', async () => {
    const employee = createEmployee({ baseSalary: 0 });
    employeesRepository['items'].push(employee);

    const vtPlan = createBenefitPlan({ type: 'VT', name: 'Vale Transporte' });
    benefitPlansRepository.items.push(vtPlan);

    const enrollment = createEnrollment(employee.id, vtPlan.id, {
      employeeContribution: 200,
      employerContribution: 100,
    });
    benefitEnrollmentsRepository.items.push(enrollment);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    // 6% of 0 = 0, min(0, 200) = 0
    expect(result.deductions[0].deductionAmount).toBe(0);
    expect(result.baseSalary).toBe(0);
  });

  it('should handle employee with no base salary defined', async () => {
    // Create employee without baseSalary (undefined in entity)
    const employeeId = new UniqueEntityID();
    const employee = Employee.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        registrationNumber: '002',
        fullName: 'Maria Santos',
        cpf: CPF.create('98765432100'),
        status: EmployeeStatus.create('ACTIVE'),
        contractType: ContractType.create('CLT'),
        workRegime: WorkRegime.create('FULL_TIME'),
        weeklyHours: 44,
        hireDate: new Date('2024-01-01'),
        country: 'BR',
        pcd: false,
        metadata: {},
        pendingIssues: [],
        // baseSalary intentionally omitted (undefined)
      },
      employeeId,
    );
    employeesRepository['items'].push(employee);

    const healthPlan = createBenefitPlan({ type: 'HEALTH', name: 'Saúde' });
    benefitPlansRepository.items.push(healthPlan);

    const enrollment = createEnrollment(employee.id, healthPlan.id, {
      employeeContribution: 150,
      employerContribution: 350,
    });
    benefitEnrollmentsRepository.items.push(enrollment);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    // baseSalary is undefined, use case defaults to 0
    expect(result.baseSalary).toBe(0);
    expect(result.deductions[0].deductionAmount).toBe(150);
  });

  it('should only consider ACTIVE enrollments', async () => {
    const employee = createEmployee();
    employeesRepository['items'].push(employee);

    const healthPlan = createBenefitPlan({ type: 'HEALTH', name: 'Saúde' });
    benefitPlansRepository.items.push(healthPlan);

    const activeEnrollment = createEnrollment(employee.id, healthPlan.id, {
      employeeContribution: 200,
      employerContribution: 500,
      status: 'ACTIVE',
    });
    const cancelledEnrollment = createEnrollment(employee.id, healthPlan.id, {
      employeeContribution: 300,
      employerContribution: 700,
      status: 'CANCELLED',
    });
    benefitEnrollmentsRepository.items.push(
      activeEnrollment,
      cancelledEnrollment,
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    expect(result.deductions).toHaveLength(1);
    expect(result.deductions[0].employeeContribution).toBe(200);
  });

  it('should return correct benefit plan metadata in deduction items', async () => {
    const employee = createEmployee();
    employeesRepository['items'].push(employee);

    const planId = new UniqueEntityID();
    const healthPlan = createBenefitPlan({
      type: 'HEALTH',
      name: 'Unimed Gold',
      id: planId,
    });
    benefitPlansRepository.items.push(healthPlan);

    const enrollment = createEnrollment(employee.id, planId, {
      employeeContribution: 250,
      employerContribution: 750,
    });
    benefitEnrollmentsRepository.items.push(enrollment);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      employeeId: employee.id.toString(),
    });

    const deduction = result.deductions[0];
    expect(deduction.benefitPlanId).toBe(planId.toString());
    expect(deduction.benefitPlanName).toBe('Unimed Gold');
    expect(deduction.benefitType).toBe('HEALTH');
    expect(deduction.employeeContribution).toBe(250);
    expect(deduction.employerContribution).toBe(750);
  });
});
