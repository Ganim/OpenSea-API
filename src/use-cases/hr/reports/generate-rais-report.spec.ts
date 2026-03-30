import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CPF } from '@/entities/hr/value-objects/cpf';
import { ContractType } from '@/entities/hr/value-objects/contract-type';
import { EmployeeStatus } from '@/entities/hr/value-objects/employee-status';
import { PIS } from '@/entities/hr/value-objects/pis';
import { WorkRegime } from '@/entities/hr/value-objects/work-regime';
import { NoticeType, TerminationType } from '@/entities/hr/termination';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPayrollItemsRepository } from '@/repositories/hr/in-memory/in-memory-payroll-items-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { InMemoryTerminationsRepository } from '@/repositories/hr/in-memory/in-memory-terminations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateRaisReportUseCase } from './generate-rais-report';

let employeesRepository: InMemoryEmployeesRepository;
let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let terminationsRepository: InMemoryTerminationsRepository;
let sut: GenerateRaisReportUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Generate RAIS Report Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    terminationsRepository = new InMemoryTerminationsRepository();
    sut = new GenerateRaisReportUseCase(
      employeesRepository,
      payrollsRepository,
      payrollItemsRepository,
      terminationsRepository,
    );
  });

  it('should generate a RAIS report with active employees and payroll data', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Maria Silva',
      cpf: CPF.create('52998224725'),
      pis: PIS.create('12345678900'),
      hireDate: new Date('2023-03-01'),
      birthDate: new Date('1990-05-15'),
      gender: 'F',
      baseSalary: 5000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const payrollJan = await payrollsRepository.create({
      tenantId,
      referenceMonth: 1,
      referenceYear: 2024,
    });

    await payrollItemsRepository.create({
      payrollId: payrollJan.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário base',
      amount: 5000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payrollJan.id,
      employeeId: employee.id,
      type: 'INSS',
      description: 'INSS',
      amount: 550,
      isDeduction: true,
    });

    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.year).toBe(2024);
    expect(result.totalEmployees).toBe(1);
    expect(result.totalActiveEmployees).toBe(1);
    expect(result.totalTerminatedEmployees).toBe(0);
    expect(result.employees).toHaveLength(1);

    const empRecord = result.employees[0];
    expect(empRecord.fullName).toBe('Maria Silva');
    expect(empRecord.registrationNumber).toBe('EMP001');
    expect(empRecord.cpf).toBe('52998224725');
    expect(empRecord.pis).toBe('12345678900');
    expect(empRecord.contractType).toBe('CLT');
    expect(empRecord.weeklyHours).toBe(44);
    expect(empRecord.baseSalary).toBe(5000);

    // Monthly earnings for January
    expect(empRecord.monthlyEarnings[0].month).toBe(1);
    expect(empRecord.monthlyEarnings[0].grossAmount).toBe(5000);

    // Other months should be 0
    expect(empRecord.monthlyEarnings[1].grossAmount).toBe(0);

    expect(empRecord.annualGrossTotal).toBe(5000);
    expect(empRecord.annualDeductionsTotal).toBe(550);
    expect(empRecord.annualNetTotal).toBe(4450);
  });

  it('should include terminated employees in the year', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Carlos Santos',
      cpf: CPF.create('71428793860'),
      hireDate: new Date('2022-01-15'),
      terminationDate: new Date('2024-06-30'),
      baseSalary: 4000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('TERMINATED'),
    });

    await terminationsRepository.create({
      tenantId,
      employeeId: employee.id,
      type: TerminationType.SEM_JUSTA_CAUSA,
      terminationDate: new Date('2024-06-30'),
      lastWorkDay: new Date('2024-06-30'),
      noticeType: NoticeType.INDENIZADO,
      noticeDays: 30,
      paymentDeadline: new Date('2024-07-10'),
    });

    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.totalEmployees).toBe(1);
    expect(result.totalTerminatedEmployees).toBe(1);
    expect(result.totalActiveEmployees).toBe(0);
    expect(result.employees[0].terminationType).toBe('SEM_JUSTA_CAUSA');
  });

  it('should exclude employees terminated before the year', async () => {
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP003',
      fullName: 'Ana Pereira',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2020-01-01'),
      terminationDate: new Date('2023-12-15'),
      baseSalary: 3000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('TERMINATED'),
    });

    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.totalEmployees).toBe(0);
    expect(result.employees).toHaveLength(0);
  });

  it('should exclude employees hired after the year', async () => {
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP004',
      fullName: 'Paulo Mendes',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2025-03-01'),
      baseSalary: 6000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.totalEmployees).toBe(0);
  });

  it('should return empty report when no employees exist', async () => {
    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.totalEmployees).toBe(0);
    expect(result.totalActiveEmployees).toBe(0);
    expect(result.totalTerminatedEmployees).toBe(0);
    expect(result.employees).toHaveLength(0);
  });

  it('should aggregate payroll from multiple months correctly', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP005',
      fullName: 'Fernanda Lima',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2023-01-01'),
      baseSalary: 3000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    // Create payrolls for Jan and Feb
    const payrollJan = await payrollsRepository.create({
      tenantId,
      referenceMonth: 1,
      referenceYear: 2024,
    });

    const payrollFeb = await payrollsRepository.create({
      tenantId,
      referenceMonth: 2,
      referenceYear: 2024,
    });

    await payrollItemsRepository.create({
      payrollId: payrollJan.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 3000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payrollFeb.id,
      employeeId: employee.id,
      type: 'BASE_SALARY',
      description: 'Salário',
      amount: 3000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payrollFeb.id,
      employeeId: employee.id,
      type: 'OVERTIME',
      description: 'Horas extras',
      amount: 500,
      isDeduction: false,
    });

    const result = await sut.execute({ tenantId, year: 2024 });

    const empRecord = result.employees[0];
    expect(empRecord.monthlyEarnings[0].grossAmount).toBe(3000); // Jan
    expect(empRecord.monthlyEarnings[1].grossAmount).toBe(3500); // Feb
    expect(empRecord.annualGrossTotal).toBe(6500);
  });

  it('should sort employees alphabetically', async () => {
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP006',
      fullName: 'Zara Oliveira',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2023-01-01'),
      baseSalary: 3000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP007',
      fullName: 'Ana Beatriz',
      cpf: CPF.create('71428793860'),
      hireDate: new Date('2023-01-01'),
      baseSalary: 4000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.employees[0].fullName).toBe('Ana Beatriz');
    expect(result.employees[1].fullName).toBe('Zara Oliveira');
  });
});
