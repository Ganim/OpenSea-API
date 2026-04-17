import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryPayrollItemsRepository } from '@/repositories/hr/in-memory/in-memory-payroll-items-repository';
import { InMemoryPayrollsRepository } from '@/repositories/hr/in-memory/in-memory-payrolls-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateThirteenthSalaryUseCase } from './calculate-thirteenth-salary';

let payrollsRepository: InMemoryPayrollsRepository;
let payrollItemsRepository: InMemoryPayrollItemsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let sut: CalculateThirteenthSalaryUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Calculate Thirteenth Salary Use Case', () => {
  beforeEach(() => {
    payrollsRepository = new InMemoryPayrollsRepository();
    payrollItemsRepository = new InMemoryPayrollItemsRepository();
    employeesRepository = new InMemoryEmployeesRepository();

    sut = new CalculateThirteenthSalaryUseCase(
      payrollsRepository,
      payrollItemsRepository,
      employeesRepository,
    );
  });

  async function createActiveEmployee(
    overrides: {
      baseSalary?: number;
      hireDate?: Date;
      registrationNumber?: string;
    } = {},
  ) {
    return employeesRepository.create({
      tenantId,
      registrationNumber: overrides.registrationNumber ?? 'EMP001',
      fullName: 'Maria Silva',
      cpf: CPF.create('529.982.247-25'),
      hireDate: overrides.hireDate ?? new Date('2022-01-01'),
      status: EmployeeStatus.ACTIVE(),
      baseSalary: overrides.baseSalary ?? 5000,
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  }

  describe('1st installment', () => {
    it('should calculate 1st installment as 50% of proportional 13th', async () => {
      await createActiveEmployee({
        baseSalary: 6000,
        hireDate: new Date('2024-01-01'),
      });

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 11,
        referenceYear: 2024,
      });

      const result = await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 1,
        referenceYear: 2024,
      });

      expect(result.items.length).toBeGreaterThanOrEqual(1);

      const thirteenthItem = result.items.find(
        (item) => item.type.value === 'THIRTEENTH_SALARY',
      );
      expect(thirteenthItem).toBeDefined();
      // 1st installment (Nov) advances only months ALREADY worked (Jan-Oct),
      // never projecting Nov-Dec. Full-year hire: 10/12 × 6000 = 5000,
      // 1st installment = 2500.
      expect(thirteenthItem!.amount).toBe(2500);
      expect(thirteenthItem!.isDeduction).toBe(false);
    });

    it('should calculate proportional 1st installment for mid-year hire', async () => {
      // Hired July 1st 2024 → 4 months counted up to Oct for 1st installment
      await createActiveEmployee({
        baseSalary: 4800,
        hireDate: new Date('2024-07-01'),
      });

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 11,
        referenceYear: 2024,
      });

      const result = await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 1,
        referenceYear: 2024,
      });

      const thirteenthItem = result.items.find(
        (item) => item.type.value === 'THIRTEENTH_SALARY',
      );
      expect(thirteenthItem).toBeDefined();
      // Jul-Oct = 4 months: (4800 * 4/12) / 2 = 800
      expect(thirteenthItem!.amount).toBe(800);
    });

    it('does not project future months for 1st installment (audit regression)', async () => {
      // Audit reported: employee hired in May counted 8 months in the 1st
      // parcela — paying an advance for months not yet worked.
      await createActiveEmployee({
        baseSalary: 3000,
        hireDate: new Date('2024-05-01'),
      });

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 11,
        referenceYear: 2024,
      });

      const result = await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 1,
        referenceYear: 2024,
      });

      const thirteenthItem = result.items.find(
        (item) => item.type.value === 'THIRTEENTH_SALARY',
      );
      // Before fix: counted May-Dec = 8 → (3000 * 8/12) / 2 = 1000.
      // After fix: counts May-Oct = 6 → (3000 * 6/12) / 2 = 750.
      expect(thirteenthItem!.amount).toBe(750);
    });

    it('should not include deductions in 1st installment', async () => {
      await createActiveEmployee({ baseSalary: 10000 });

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 11,
        referenceYear: 2024,
      });

      const result = await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 1,
        referenceYear: 2024,
      });

      const deductions = result.items.filter((item) => item.isDeduction);
      expect(deductions.length).toBe(0);
    });
  });

  describe('2nd installment', () => {
    it('should calculate 2nd installment with INSS and IRRF deductions', async () => {
      await createActiveEmployee({
        baseSalary: 5000,
        hireDate: new Date('2023-01-01'),
      });

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 12,
        referenceYear: 2024,
      });

      const result = await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 2,
        referenceYear: 2024,
      });

      // Should have salary item + INSS + IRRF (possibly) + FGTS
      const salaryItem = result.items.find(
        (item) => item.type.value === 'THIRTEENTH_SALARY',
      );
      expect(salaryItem).toBeDefined();
      expect(salaryItem!.isDeduction).toBe(false);

      const inssItem = result.items.find((item) => item.type.value === 'INSS');
      expect(inssItem).toBeDefined();
      expect(inssItem!.isDeduction).toBe(true);
      expect(inssItem!.amount).toBeGreaterThan(0);

      const fgtsItem = result.items.find((item) => item.type.value === 'FGTS');
      expect(fgtsItem).toBeDefined();
      expect(fgtsItem!.isDeduction).toBe(false);
      // FGTS = 8% of full 13th
      expect(fgtsItem!.amount).toBe(400); // 5000 * 0.08
    });

    it('should calculate FGTS as 8% of full 13th salary', async () => {
      await createActiveEmployee({
        baseSalary: 3000,
        hireDate: new Date('2023-01-01'),
      });

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 12,
        referenceYear: 2024,
      });

      const result = await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 2,
        referenceYear: 2024,
      });

      const fgtsItem = result.items.find((item) => item.type.value === 'FGTS');
      expect(fgtsItem).toBeDefined();
      // Full 13th = 3000 (12/12 months), FGTS = 3000 * 0.08 = 240
      expect(fgtsItem!.amount).toBe(240);
    });
  });

  describe('proportional months calculation', () => {
    it('should count 0 months for employee hired after reference year', async () => {
      await createActiveEmployee({ hireDate: new Date('2025-06-01') });

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 11,
        referenceYear: 2024,
      });

      const result = await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 1,
        referenceYear: 2024,
      });

      // No items should be generated for this employee
      const thirteenthItems = result.items.filter(
        (item) => item.type.value === 'THIRTEENTH_SALARY',
      );
      expect(thirteenthItems.length).toBe(0);
    });

    it('should skip employees with zero base salary', async () => {
      await createActiveEmployee({ baseSalary: 0 });

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 11,
        referenceYear: 2024,
      });

      const result = await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 1,
        referenceYear: 2024,
      });

      expect(result.items.length).toBe(0);
    });

    it('should not count month if worked fewer than 15 days', async () => {
      // Hired Dec 18 → only 14 days in December → 0 months
      await createActiveEmployee({
        baseSalary: 3000,
        hireDate: new Date(2024, 11, 18), // Dec 18 local time
      });

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 12,
        referenceYear: 2024,
      });

      const result = await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 1,
        referenceYear: 2024,
      });

      const thirteenthItems = result.items.filter(
        (item) => item.type.value === 'THIRTEENTH_SALARY',
      );
      expect(thirteenthItems.length).toBe(0);
    });
  });

  describe('validation', () => {
    it('should throw error for invalid installment number', async () => {
      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 11,
        referenceYear: 2024,
      });

      await expect(
        sut.execute({
          tenantId,
          payrollId: payroll.id.toString(),
          processedBy: new UniqueEntityID().toString(),
          installment: 3 as 1 | 2,
          referenceYear: 2024,
        }),
      ).rejects.toThrow('Parcela do 13º deve ser 1 ou 2');
    });

    it('should throw error if payroll not found', async () => {
      await expect(
        sut.execute({
          tenantId,
          payrollId: new UniqueEntityID().toString(),
          processedBy: new UniqueEntityID().toString(),
          installment: 1,
          referenceYear: 2024,
        }),
      ).rejects.toThrow('Folha de pagamento não encontrada');
    });

    it('should throw error if payroll is not in draft status', async () => {
      await createActiveEmployee();

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 11,
        referenceYear: 2024,
      });

      // Process it once to change status
      await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 1,
        referenceYear: 2024,
      });

      // Try again — should fail
      await expect(
        sut.execute({
          tenantId,
          payrollId: payroll.id.toString(),
          processedBy: new UniqueEntityID().toString(),
          installment: 1,
          referenceYear: 2024,
        }),
      ).rejects.toThrow('Apenas folhas em rascunho podem ser calculadas');
    });
  });

  describe('payroll totals', () => {
    it('should update payroll total gross and deductions after calculation', async () => {
      await createActiveEmployee({ baseSalary: 5000 });

      const payroll = await payrollsRepository.create({
        tenantId,
        referenceMonth: 12,
        referenceYear: 2024,
      });

      const result = await sut.execute({
        tenantId,
        payrollId: payroll.id.toString(),
        processedBy: new UniqueEntityID().toString(),
        installment: 2,
        referenceYear: 2024,
      });

      expect(result.payroll.totalGross).toBeGreaterThan(0);
      expect(result.payroll.totalDeductions).toBeGreaterThan(0);
      expect(result.payroll.status.isCalculated()).toBe(true);
    });
  });
});
