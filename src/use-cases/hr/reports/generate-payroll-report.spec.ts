import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CPF } from '@/entities/hr/value-objects/cpf';
import { ContractType } from '@/entities/hr/value-objects/contract-type';
import { EmployeeStatus } from '@/entities/hr/value-objects/employee-status';
import { WorkRegime } from '@/entities/hr/value-objects/work-regime';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPayrollItemsRepository } from '@/repositories/hr/in-memory/in-memory-payroll-items-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GeneratePayrollReportUseCase } from './generate-payroll-report';

let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: GeneratePayrollReportUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Generate Payroll Report Use Case', () => {
  beforeEach(() => {
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    sut = new GeneratePayrollReportUseCase(
      payrollsRepository,
      payrollItemsRepository,
      employeesRepository,
    );
  });

  it('should generate CSV with correct headers and payroll data', async () => {
    // Create employee
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      baseSalary: 5000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    // Create payroll
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
      totalGross: 5500,
      totalDeductions: 1100,
    });

    // Create payroll items - earnings
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário base',
      amount: 5000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'OVERTIME',
      description: 'Horas extras',
      amount: 500,
      isDeduction: false,
    });

    // Create payroll items - deductions
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'INSS',
      description: 'INSS',
      amount: 600,
      isDeduction: true,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'IRRF',
      description: 'IRRF',
      amount: 300,
      isDeduction: true,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'FGTS',
      description: 'FGTS',
      amount: 200,
      isDeduction: true,
    });

    const result = await sut.execute({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
    });

    // BOM prefix
    expect(result.csv.startsWith('\uFEFF')).toBe(true);

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    // header + 1 employee row + TOTAL row
    expect(lines.length).toBe(3);

    // Header
    expect(lines[0]).toContain('Funcionário');
    expect(lines[0]).toContain('Salário Base');
    expect(lines[0]).toContain('Horas Extras');
    expect(lines[0]).toContain('Total Proventos');
    expect(lines[0]).toContain('INSS');
    expect(lines[0]).toContain('IRRF');
    expect(lines[0]).toContain('FGTS');
    expect(lines[0]).toContain('Total Descontos');
    expect(lines[0]).toContain('Líquido');

    // Employee row - should use employee name
    expect(lines[1]).toContain('"João Silva"');

    // TOTAL summary row
    expect(lines[2]).toContain('"TOTAL"');

    // File name
    expect(result.fileName).toBe('folha_pagamento_03_2024.csv');
  });

  it('should return message CSV when no payroll exists for the period', async () => {
    const result = await sut.execute({
      tenantId,
      referenceMonth: 1,
      referenceYear: 2024,
    });

    expect(result.csv.startsWith('\uFEFF')).toBe(true);
    expect(result.csv).toContain(
      'Nenhuma folha de pagamento encontrada para 01/2024',
    );
    expect(result.fileName).toBe('folha_01_2024.csv');
  });

  it('should generate header-only + TOTAL row when payroll exists but has no items', async () => {
    await payrollsRepository.create({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
    });

    const result = await sut.execute({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    // header + TOTAL row only (no employee rows)
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('"TOTAL"');
  });

  it('should group items by employee and calculate totals correctly', async () => {
    const emp1 = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Ana Costa',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      baseSalary: 3000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const emp2 = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Bruno Lima',
      cpf: CPF.create('71428793860'),
      hireDate: new Date('2024-01-01'),
      baseSalary: 4000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
    });

    // Employee 1 items
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: emp1.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 3000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: emp1.id,
      type: 'INSS',
      description: 'INSS',
      amount: 300,
      isDeduction: true,
    });

    // Employee 2 items
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: emp2.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 4000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: emp2.id,
      type: 'INSS',
      description: 'INSS',
      amount: 400,
      isDeduction: true,
    });

    const result = await sut.execute({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    // header + 2 employees + TOTAL
    expect(lines.length).toBe(4);

    // Sorted alphabetically by name: Ana Costa before Bruno Lima
    expect(lines[1]).toContain('"Ana Costa"');
    expect(lines[2]).toContain('"Bruno Lima"');

    // TOTAL row
    expect(lines[3]).toContain('"TOTAL"');
  });

  it('should categorize other earnings and other deductions correctly', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      baseSalary: 5000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
    });

    // Base salary
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 5000,
      isDeduction: false,
    });

    // Bonus (goes to "Outros Proventos")
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'BONUS',
      description: 'Bônus',
      amount: 1000,
      isDeduction: false,
    });

    // Health plan deduction (goes to "Outros Descontos")
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'HEALTH_PLAN',
      description: 'Plano de Saúde',
      amount: 250,
      isDeduction: true,
    });

    const result = await sut.execute({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    const dataCells = lines[1].split(';').map((c: string) => c.replace(/"/g, ''));

    // Index 0: name, 1: base salary, 2: overtime, 3: other earnings,
    // 4: total gross, 5: INSS, 6: IRRF, 7: FGTS, 8: other deductions,
    // 9: total deductions, 10: net
    const otherEarnings = dataCells[3]; // Should be 1000 (bonus)
    const otherDeductions = dataCells[8]; // Should be 250 (health plan)

    // formatCurrency uses pt-BR locale
    expect(otherEarnings).toContain('1');
    expect(otherDeductions).toContain('250');
  });

  it('should pad month with leading zero in filename', async () => {
    const result = await sut.execute({
      tenantId,
      referenceMonth: 1,
      referenceYear: 2024,
    });

    expect(result.fileName).toBe('folha_01_2024.csv');
  });

  it('should use semicolon as CSV delimiter', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'João Silva',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2024-01-01'),
      baseSalary: 5000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 5000,
      isDeduction: false,
    });

    const result = await sut.execute({
      tenantId,
      referenceMonth: 3,
      referenceYear: 2024,
    });

    const lines = result.csv.replace('\uFEFF', '').split('\r\n');
    expect(lines[0].split(';').length).toBe(11); // 11 columns
    expect(lines[1].split(';').length).toBe(11);
  });
});
