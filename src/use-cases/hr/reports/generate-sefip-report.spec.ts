import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CPF } from '@/entities/hr/value-objects/cpf';
import { ContractType } from '@/entities/hr/value-objects/contract-type';
import { EmployeeStatus } from '@/entities/hr/value-objects/employee-status';
import { PIS } from '@/entities/hr/value-objects/pis';
import { WorkRegime } from '@/entities/hr/value-objects/work-regime';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPayrollItemsRepository } from '@/repositories/hr/in-memory/in-memory-payroll-items-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateSefipReportUseCase } from './generate-sefip-report';

let employeesRepository: InMemoryEmployeesRepository;
let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let sut: GenerateSefipReportUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Generate SEFIP Report Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    sut = new GenerateSefipReportUseCase(
      employeesRepository,
      payrollsRepository,
      payrollItemsRepository,
    );
  });

  it('should generate SEFIP report with FGTS and INSS data', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Marcos Vieira',
      cpf: CPF.create('52998224725'),
      pis: PIS.create('12345678900'),
      hireDate: new Date('2023-01-01'),
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
      description: 'Salário base',
      amount: 5000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'FGTS',
      description: 'FGTS',
      amount: 400,
      isDeduction: true,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'INSS',
      description: 'INSS',
      amount: 550,
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

    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    expect(result.year).toBe(2024);
    expect(result.month).toBe(3);
    expect(result.totalEmployees).toBe(1);
    expect(result.totalFgtsBase).toBe(5000);
    expect(result.totalFgtsAmount).toBe(400);
    expect(result.totalInssBase).toBe(5000);
    expect(result.totalInssAmount).toBe(550);

    const empRecord = result.employees[0];
    expect(empRecord.fullName).toBe('Marcos Vieira');
    expect(empRecord.cpf).toBe('52998224725');
    expect(empRecord.pis).toBe('12345678900');
    expect(empRecord.grossSalary).toBe(5000);
    expect(empRecord.fgtsBase).toBe(5000);
    expect(empRecord.fgtsAmount).toBe(400);
    expect(empRecord.inssBase).toBe(5000);
    expect(empRecord.inssAmount).toBe(550);
    expect(empRecord.irrfAmount).toBe(300);
  });

  it('should return empty report when no payroll exists for the period', async () => {
    const result = await sut.execute({ tenantId, year: 2024, month: 1 });

    expect(result.totalEmployees).toBe(0);
    expect(result.totalFgtsBase).toBe(0);
    expect(result.totalFgtsAmount).toBe(0);
    expect(result.totalInssBase).toBe(0);
    expect(result.totalInssAmount).toBe(0);
    expect(result.employees).toHaveLength(0);
  });

  it('should calculate FGTS at 8% when no explicit FGTS deduction exists', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Rita Nascimento',
      cpf: CPF.create('71428793860'),
      hireDate: new Date('2023-06-01'),
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

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 4000,
      isDeduction: false,
    });

    // No FGTS deduction item — should calculate at 8%
    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'INSS',
      description: 'INSS',
      amount: 440,
      isDeduction: true,
    });

    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    const empRecord = result.employees[0];
    // 4000 * 0.08 = 320
    expect(empRecord.fgtsAmount).toBeCloseTo(320, 2);
    expect(empRecord.fgtsBase).toBe(4000);
  });

  it('should aggregate data for multiple employees', async () => {
    const emp1 = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP003',
      fullName: 'Ana Costa',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2023-01-01'),
      baseSalary: 3000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const emp2 = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP004',
      fullName: 'Bruno Lima',
      cpf: CPF.create('71428793860'),
      hireDate: new Date('2023-01-01'),
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

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: emp2.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 5000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: emp2.id,
      type: 'INSS',
      description: 'INSS',
      amount: 550,
      isDeduction: true,
    });

    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    expect(result.totalEmployees).toBe(2);
    expect(result.totalInssAmount).toBe(850);
    expect(result.totalInssBase).toBe(8000);

    // Sorted alphabetically
    expect(result.employees[0].fullName).toBe('Ana Costa');
    expect(result.employees[1].fullName).toBe('Bruno Lima');
  });

  it('should include overtime in gross salary and FGTS base', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP005',
      fullName: 'Daniela Ramos',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2023-01-01'),
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

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 4000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'OVERTIME',
      description: 'Horas extras',
      amount: 600,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId: employee.id,
      type: 'FGTS',
      description: 'FGTS',
      amount: 368,
      isDeduction: true,
    });

    const result = await sut.execute({ tenantId, year: 2024, month: 3 });

    const empRecord = result.employees[0];
    expect(empRecord.grossSalary).toBe(4600); // 4000 + 600
    expect(empRecord.fgtsBase).toBe(4600);
    expect(empRecord.fgtsAmount).toBe(368);
  });
});
