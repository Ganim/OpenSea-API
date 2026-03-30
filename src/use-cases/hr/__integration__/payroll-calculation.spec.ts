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
import { ApprovePayrollUseCase } from '@/use-cases/hr/payrolls/approve-payroll';
import { CalculatePayrollUseCase } from '@/use-cases/hr/payrolls/calculate-payroll';
import { CreatePayrollUseCase } from '@/use-cases/hr/payrolls/create-payroll';
import { beforeEach, describe, expect, it } from 'vitest';

let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let overtimeRepository: InMemoryOvertimeRepository;
let absencesRepository: InMemoryAbsencesRepository;
let bonusesRepository: InMemoryBonusesRepository;
let deductionsRepository: InMemoryDeductionsRepository;

let createPayroll: CreatePayrollUseCase;
let calculatePayroll: CalculatePayrollUseCase;
let approvePayroll: ApprovePayrollUseCase;

let testEmployee: Employee;
const tenantId = new UniqueEntityID().toString();

describe('[Integration] Payroll Calculation Flow', () => {
  beforeEach(async () => {
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    overtimeRepository = new InMemoryOvertimeRepository();
    absencesRepository = new InMemoryAbsencesRepository();
    bonusesRepository = new InMemoryBonusesRepository();
    deductionsRepository = new InMemoryDeductionsRepository();

    createPayroll = new CreatePayrollUseCase(payrollsRepository);
    calculatePayroll = new CalculatePayrollUseCase(
      payrollsRepository,
      payrollItemsRepository,
      employeesRepository,
      overtimeRepository,
      absencesRepository,
      bonusesRepository,
      deductionsRepository,
    );
    approvePayroll = new ApprovePayrollUseCase(payrollsRepository);

    testEmployee = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP001',
      fullName: 'Gabriel Santos',
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

  it('should create → calculate → approve a payroll', async () => {
    // Step 1: Create payroll
    const { payroll: createdPayroll } = await createPayroll.execute({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    expect(createdPayroll.status.isDraft()).toBe(true);

    // Step 2: Calculate payroll
    const processedBy = new UniqueEntityID().toString();
    const { payroll: calculatedPayroll, items } =
      await calculatePayroll.execute({
        tenantId,
        payrollId: createdPayroll.id.toString(),
        processedBy,
      });

    expect(calculatedPayroll.status.isCalculated()).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);

    // Should have base salary
    const baseSalaryItem = items.find(
      (item) => item.type.value === 'BASE_SALARY',
    );
    expect(baseSalaryItem).toBeDefined();
    expect(baseSalaryItem?.amount).toBe(5000);

    // Gross should be positive
    expect(calculatedPayroll.totalGross).toBeGreaterThan(0);

    // Net = gross - deductions
    expect(calculatedPayroll.totalNet).toBe(
      calculatedPayroll.totalGross - calculatedPayroll.totalDeductions,
    );

    // Step 3: Approve payroll
    const approvedBy = new UniqueEntityID().toString();
    const { payroll: approvedPayroll } = await approvePayroll.execute({
      tenantId,
      payrollId: createdPayroll.id.toString(),
      approvedBy,
    });

    expect(approvedPayroll.status.isApproved()).toBe(true);
  });

  it('should include bonuses in payroll calculation', async () => {
    await bonusesRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      name: 'Performance Bonus Q2',
      amount: 2000,
      reason: 'Desempenho excepcional no segundo trimestre',
      date: new Date(),
    });

    const { payroll } = await createPayroll.execute({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    const { items } = await calculatePayroll.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      processedBy: new UniqueEntityID().toString(),
    });

    const bonusItem = items.find((item) => item.type.value === 'BONUS');
    expect(bonusItem).toBeDefined();
    expect(bonusItem?.amount).toBe(2000);
  });

  it('should include deductions in payroll calculation', async () => {
    await deductionsRepository.create({
      tenantId,
      employeeId: testEmployee.id,
      name: 'Loan Repayment',
      amount: 500,
      reason: 'Adiantamento salarial parcelado',
      date: new Date(),
    });

    const { payroll } = await createPayroll.execute({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    const { payroll: calculatedPayroll, items } =
      await calculatePayroll.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
      });

    const deductionItem = items.find(
      (item) => item.type.value === 'OTHER_DEDUCTION',
    );
    expect(deductionItem).toBeDefined();
    expect(deductionItem?.amount).toBe(500);
    expect(deductionItem?.isDeduction).toBe(true);
    expect(calculatedPayroll.totalDeductions).toBeGreaterThan(0);
  });

  it('should not allow duplicate payroll for same period', async () => {
    await createPayroll.execute({
      tenantId,
      referenceMonth: 6,
      referenceYear: 2024,
    });

    await expect(
      createPayroll.execute({
        tenantId,
        referenceMonth: 6,
        referenceYear: 2024,
      }),
    ).rejects.toThrow('Já existe uma folha de pagamento para 6/2024');
  });

  it('should not approve a draft payroll (must be calculated first)', async () => {
    const { payroll } = await createPayroll.execute({
      tenantId,
      referenceMonth: 7,
      referenceYear: 2024,
    });

    await expect(
      approvePayroll.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        approvedBy: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Apenas folhas calculadas podem ser aprovadas');
  });

  it('should calculate INSS deduction for employee', async () => {
    const { payroll } = await createPayroll.execute({
      tenantId,
      referenceMonth: 8,
      referenceYear: 2024,
    });

    const { items } = await calculatePayroll.execute({
      tenantId,
      payrollId: payroll.id.toString(),
      processedBy: new UniqueEntityID().toString(),
    });

    const inssItem = items.find((item) => item.type.value === 'INSS');
    expect(inssItem).toBeDefined();
    expect(inssItem?.isDeduction).toBe(true);
    expect(inssItem?.amount).toBeGreaterThan(0);
  });
});
