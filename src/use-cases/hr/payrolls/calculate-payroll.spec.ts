import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryAbsencesRepository } from '@/repositories/hr/in-memory/in-memory-absences-repository';
import { InMemoryBonusesRepository } from '@/repositories/hr/in-memory/in-memory-bonuses-repository';
import { InMemoryDeductionsRepository } from '@/repositories/hr/in-memory/in-memory-deductions-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryOvertimeRepository } from '@/repositories/hr/in-memory/in-memory-overtime-repository';
import { InMemoryPayrollItemsRepository } from '@/repositories/hr/in-memory/in-memory-payroll-items-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculatePayrollUseCase } from './calculate-payroll';

let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let overtimeRepository: InMemoryOvertimeRepository;
let absencesRepository: InMemoryAbsencesRepository;
let bonusesRepository: InMemoryBonusesRepository;
let deductionsRepository: InMemoryDeductionsRepository;
let sut: CalculatePayrollUseCase;
let testEmployee: Employee;

const tenantId = new UniqueEntityID().toString();

describe('Calculate Payroll Use Case', () => {
  beforeEach(async () => {
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    overtimeRepository = new InMemoryOvertimeRepository();
    absencesRepository = new InMemoryAbsencesRepository();
    bonusesRepository = new InMemoryBonusesRepository();
    deductionsRepository = new InMemoryDeductionsRepository();

    sut = new CalculatePayrollUseCase(
      payrollsRepository,
      payrollItemsRepository,
      employeesRepository,
      overtimeRepository,
      absencesRepository,
      bonusesRepository,
      deductionsRepository,
    );

    // Create test employee with base salary
    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Test Employee',
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

  it('should calculate payroll for employee with only base salary', async () => {
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    const processedBy = new UniqueEntityID();

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      processedBy: processedBy.toString(),
    });

    expect(result.payroll).toBeDefined();
    expect(result.payroll.status.isCalculated()).toBe(true);
    expect(result.items.length).toBeGreaterThanOrEqual(1);

    // Should have base salary item
    const baseSalaryItem = result.items.find(
      (item) => item.type.value === 'BASE_SALARY',
    );
    expect(baseSalaryItem).toBeDefined();
    expect(baseSalaryItem?.amount).toBe(5000);
  });

  it('should throw error if payroll not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        payrollId: new UniqueEntityID().toString(),
        processedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Folha de pagamento não encontrada');
  });

  it('should throw error if payroll is not in draft status', async () => {
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    // Calculate first time
    await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      processedBy: new UniqueEntityID().toString(),
    });

    // Try to calculate again
    await expect(
      sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Apenas folhas em rascunho podem ser calculadas');
  });

  it('should calculate INSS correctly for salary in first bracket', async () => {
    // Create employee with low salary (first INSS bracket - 7.5%)
    await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP002',
      fullName: 'Low Salary Employee',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: 1400, // Below first bracket limit
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      processedBy: new UniqueEntityID().toString(),
    });

    // Find INSS items for low salary employee
    const inssItems = result.items.filter((item) => item.type.value === 'INSS');
    expect(inssItems.length).toBeGreaterThan(0);
  });

  it('should include bonuses in payroll calculation', async () => {
    // Create a bonus for the employee
    await bonusesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      name: 'Performance Bonus',
      amount: 1000,
      reason: 'Excellent performance',
      date: new Date(),
    });

    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      processedBy: new UniqueEntityID().toString(),
    });

    const bonusItem = result.items.find((item) => item.type.value === 'BONUS');
    expect(bonusItem).toBeDefined();
    expect(bonusItem?.amount).toBe(1000);
  });

  it('should include deductions in payroll calculation', async () => {
    // Create a deduction for the employee
    await deductionsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      name: 'Advance Repayment',
      amount: 500,
      reason: 'Salary advance repayment',
      date: new Date(),
    });

    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      processedBy: new UniqueEntityID().toString(),
    });

    const deductionItem = result.items.find(
      (item) => item.type.value === 'OTHER_DEDUCTION',
    );
    expect(deductionItem).toBeDefined();
    expect(deductionItem?.amount).toBe(500);
    expect(deductionItem?.isDeduction).toBe(true);
  });

  it('should calculate total gross and net correctly', async () => {
    const payroll = await payrollsRepository.create({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    const result = await sut.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      processedBy: new UniqueEntityID().toString(),
    });

    // Total gross should include base salary
    expect(result.payroll.totalGross).toBeGreaterThan(0);

    // Total deductions should include INSS
    expect(result.payroll.totalDeductions).toBeGreaterThan(0);

    // Total net should be gross - deductions
    expect(result.payroll.totalNet).toBe(
      result.payroll.totalGross - result.payroll.totalDeductions,
    );
  });
});
