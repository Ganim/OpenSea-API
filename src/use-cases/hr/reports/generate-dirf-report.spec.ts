import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CPF } from '@/entities/hr/value-objects/cpf';
import { ContractType } from '@/entities/hr/value-objects/contract-type';
import { EmployeeStatus } from '@/entities/hr/value-objects/employee-status';
import { WorkRegime } from '@/entities/hr/value-objects/work-regime';
import { InMemoryDependantsRepository } from '@/repositories/hr/in-memory/in-memory-dependants-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPayrollItemsRepository } from '@/repositories/hr/in-memory/in-memory-payroll-items-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateDirfReportUseCase } from './generate-dirf-report';

let employeesRepository: InMemoryEmployeesRepository;
let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let dependantsRepository: InMemoryDependantsRepository;
let sut: GenerateDirfReportUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Generate DIRF Report Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    dependantsRepository = new InMemoryDependantsRepository();
    sut = new GenerateDirfReportUseCase(
      employeesRepository,
      payrollsRepository,
      payrollItemsRepository,
      dependantsRepository,
    );
  });

  it('should generate DIRF report with income and IRRF data', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Roberto Alves',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2023-01-01'),
      baseSalary: 8000,
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
      amount: 8000,
      isDeduction: false,
    });

    await payrollItemsRepository.create({
      payrollId: payrollJan.id,
      employeeId: employee.id,
      type: 'IRRF',
      description: 'IRRF',
      amount: 1200,
      isDeduction: true,
    });

    await payrollItemsRepository.create({
      payrollId: payrollJan.id,
      employeeId: employee.id,
      type: 'INSS',
      description: 'INSS',
      amount: 828.38,
      isDeduction: true,
    });

    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.year).toBe(2024);
    expect(result.totalEmployees).toBe(1);
    expect(result.totalIrrfWithheld).toBe(1200);
    expect(result.totalGrossIncome).toBe(8000);

    const empRecord = result.employees[0];
    expect(empRecord.fullName).toBe('Roberto Alves');
    expect(empRecord.annualGrossIncome).toBe(8000);
    expect(empRecord.annualIrrfWithheld).toBe(1200);
    expect(empRecord.annualInssWithheld).toBe(828.38);

    // Monthly breakdown
    expect(empRecord.monthlyIncome[0].month).toBe(1);
    expect(empRecord.monthlyIncome[0].grossIncome).toBe(8000);
    expect(empRecord.monthlyIncome[0].irrfWithheld).toBe(1200);
  });

  it('should include dependant deduction calculation', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Luciana Campos',
      cpf: CPF.create('71428793860'),
      hireDate: new Date('2023-01-01'),
      baseSalary: 6000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    // Add IRRF dependant
    await dependantsRepository.create({
      tenantId,
      employeeId: employee.id,
      name: 'João Campos',
      birthDate: new Date('2015-06-10'),
      relationship: 'CHILD',
      isIrrfDependant: true,
      isSalarioFamilia: false,
      hasDisability: false,
    });

    // Non-IRRF dependant (should not count)
    await dependantsRepository.create({
      tenantId,
      employeeId: employee.id,
      name: 'Maria Campos',
      birthDate: new Date('2020-03-20'),
      relationship: 'CHILD',
      isIrrfDependant: false,
      isSalarioFamilia: true,
      hasDisability: false,
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
      description: 'Salário',
      amount: 6000,
      isDeduction: false,
    });

    const result = await sut.execute({ tenantId, year: 2024 });

    const empRecord = result.employees[0];
    expect(empRecord.dependantCount).toBe(1);
    // 1 dependant * 1 month worked * R$ 189.59
    expect(empRecord.annualDependantDeduction).toBeCloseTo(189.59, 2);
  });

  it('should return empty report when no employees exist', async () => {
    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.totalEmployees).toBe(0);
    expect(result.totalIrrfWithheld).toBe(0);
    expect(result.totalGrossIncome).toBe(0);
    expect(result.employees).toHaveLength(0);
  });

  it('should aggregate IRRF across multiple months', async () => {
    const employee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP003',
      fullName: 'Pedro Souza',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2023-01-01'),
      baseSalary: 10000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    for (let month = 1; month <= 3; month++) {
      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: month,
        referenceYear: 2024,
      });

      await payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId: employee.id,
        type: 'BASE_SALARY',
        description: 'Salário',
        amount: 10000,
        isDeduction: false,
      });

      await payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId: employee.id,
        type: 'IRRF',
        description: 'IRRF',
        amount: 1500,
        isDeduction: true,
      });
    }

    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.totalGrossIncome).toBe(30000);
    expect(result.totalIrrfWithheld).toBe(4500);

    const empRecord = result.employees[0];
    expect(empRecord.annualGrossIncome).toBe(30000);
    expect(empRecord.annualIrrfWithheld).toBe(4500);
  });

  it('should sort employees alphabetically', async () => {
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP004',
      fullName: 'Zélia Rodrigues',
      cpf: CPF.create('52998224725'),
      hireDate: new Date('2023-01-01'),
      baseSalary: 5000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP005',
      fullName: 'Amanda Ferreira',
      cpf: CPF.create('71428793860'),
      hireDate: new Date('2023-01-01'),
      baseSalary: 6000,
      contractType: ContractType.create('CLT'),
      workRegime: WorkRegime.create('FULL_TIME'),
      weeklyHours: 44,
      country: 'Brasil',
      status: EmployeeStatus.create('ACTIVE'),
    });

    const result = await sut.execute({ tenantId, year: 2024 });

    expect(result.employees[0].fullName).toBe('Amanda Ferreira');
    expect(result.employees[1].fullName).toBe('Zélia Rodrigues');
  });
});
