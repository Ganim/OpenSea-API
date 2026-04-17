import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { getINSSTable, getIRRFTable } from '@/constants/hr/tax-tables';
import type { Employee } from '@/entities/hr/employee';
import type { PayrollItem } from '@/entities/hr/payroll-item';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { Payroll } from '@/entities/hr/payroll';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

/** IRRF dependant deduction per Brazilian tax law */
const IRRF_DEPENDANT_DEDUCTION = 189.59;

export interface CalculateThirteenthSalaryRequest {
  tenantId: string;
  payrollId: string;
  processedBy: string;
  installment: 1 | 2; // 1st installment (Nov) or 2nd installment (Dec)
  referenceYear: number;
  /** Number of IRRF dependants per employee (employeeId -> count) */
  irrfDependantsByEmployee?: Map<string, number>;
}

export interface CalculateThirteenthSalaryResponse {
  payroll: Payroll;
  items: PayrollItem[];
}

export class CalculateThirteenthSalaryUseCase {
  constructor(
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
    private employeesRepository: EmployeesRepository,
    private transactionManager?: TransactionManager,
  ) {}

  async execute(
    request: CalculateThirteenthSalaryRequest,
  ): Promise<CalculateThirteenthSalaryResponse> {
    const {
      tenantId,
      payrollId,
      processedBy,
      installment,
      referenceYear,
      irrfDependantsByEmployee,
    } = request;

    if (installment !== 1 && installment !== 2) {
      throw new BadRequestError('Parcela do 13º deve ser 1 ou 2');
    }

    const payroll = await this.payrollsRepository.findById(
      new UniqueEntityID(payrollId),
      tenantId,
    );

    if (!payroll) {
      throw new ResourceNotFoundError('Folha de pagamento não encontrada');
    }

    if (!payroll.status.isDraft()) {
      throw new BadRequestError(
        'Apenas folhas em rascunho podem ser calculadas',
      );
    }

    payroll.startProcessing(new UniqueEntityID(processedBy));

    const calculateAll =
      async (): Promise<CalculateThirteenthSalaryResponse> => {
        const employees =
          await this.employeesRepository.findManyActive(tenantId);

        const createdItems: PayrollItem[] = [];

        for (const employee of employees) {
          const employeeItems = await this.calculateEmployee13th(
            payroll,
            employee,
            installment,
            referenceYear,
            irrfDependantsByEmployee?.get(employee.id.toString()) ?? 0,
          );
          createdItems.push(...employeeItems);
        }

        const { totalGross, totalDeductions } =
          await this.payrollItemsRepository.sumByPayroll(payroll.id);

        payroll.finishCalculation(totalGross, totalDeductions);
        await this.payrollsRepository.save(payroll);

        return { payroll, items: createdItems };
      };

    if (this.transactionManager) {
      return this.transactionManager.run(async () => calculateAll());
    }

    return calculateAll();
  }

  /**
   * Calculates the proportional months worked in the reference year up to
   * the cut-off month of the current installment.
   *
   * The 1st installment is paid by Nov 30 (Decreto 57.155/65 Art. 3), so
   * only months already worked *up to October* can be counted — otherwise
   * the advance would be inflated for employees hired mid-year.
   * The 2nd installment settles the full year (Jan-Dec).
   *
   * Art. 130 §CLT (via Decreto 57.155) — month counts only if ≥15 days
   * were worked in it.
   */
  private calculateProportionalMonths(
    hireDate: Date,
    referenceYear: number,
    installment: 1 | 2,
  ): number {
    const yearStart = new Date(referenceYear, 0, 1);
    // 1st installment considers months through October (index 9);
    // 2nd installment considers all months through December (index 11).
    const cutOffMonthIndex = installment === 1 ? 9 : 11;
    const cutOffEnd = new Date(referenceYear, cutOffMonthIndex + 1, 0);

    // Employee hired after this year? Start from hire month
    const effectiveStart = hireDate > yearStart ? hireDate : yearStart;

    if (effectiveStart > cutOffEnd) return 0;

    let months = 0;

    for (
      let month = effectiveStart.getMonth();
      month <= cutOffMonthIndex;
      month++
    ) {
      const monthStart = new Date(referenceYear, month, 1);
      const monthEnd = new Date(referenceYear, month + 1, 0); // Last day of month

      // Determine start day in this month
      const startDay =
        effectiveStart > monthStart ? effectiveStart.getDate() : 1;

      // Days worked in this month
      const daysInMonth = monthEnd.getDate();
      const daysWorked = daysInMonth - startDay + 1;

      // ≥15 days worked counts as a full month
      if (daysWorked >= 15) {
        months++;
      }
    }

    return months;
  }

  private async calculateEmployee13th(
    payroll: Payroll,
    employee: Employee,
    installment: 1 | 2,
    referenceYear: number,
    numberOfIrrfDependants: number,
  ): Promise<PayrollItem[]> {
    const items: PayrollItem[] = [];
    const employeeId = employee.id;

    if (!employee.status.isActive()) return items;

    const baseSalary = employee.baseSalary ?? 0;
    if (baseSalary <= 0) return items;

    const proportionalMonths = this.calculateProportionalMonths(
      employee.hireDate,
      referenceYear,
      installment,
    );

    if (proportionalMonths <= 0) return items;

    // Full 13th salary amount (proportional)
    const fullThirteenth = (baseSalary * proportionalMonths) / 12;

    if (installment === 1) {
      // 1st installment (November): 50% of base salary, no deductions
      const firstInstallment = Math.round((fullThirteenth / 2) * 100) / 100;

      const item = await this.payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId,
        type: 'THIRTEENTH_SALARY',
        description: `13º Salário - 1ª Parcela (${proportionalMonths}/12 meses)`,
        amount: firstInstallment,
        isDeduction: false,
      });
      items.push(item);
    } else {
      // 2nd installment (December): remaining 50% + averages, with INSS + IRRF
      const secondInstallment = Math.round((fullThirteenth / 2) * 100) / 100;

      const salaryItem = await this.payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId,
        type: 'THIRTEENTH_SALARY',
        description: `13º Salário - 2ª Parcela (${proportionalMonths}/12 meses)`,
        amount: secondInstallment,
        isDeduction: false,
      });
      items.push(salaryItem);

      // INSS on full 13th salary
      const inssAmount = this.calculateINSS(fullThirteenth, referenceYear);
      if (inssAmount > 0) {
        const inssItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'INSS',
          description: 'INSS - 13º Salário',
          amount: inssAmount,
          isDeduction: true,
        });
        items.push(inssItem);
      }

      // IRRF on full 13th salary (separate from monthly IRRF)
      const irrfBase =
        fullThirteenth -
        inssAmount -
        IRRF_DEPENDANT_DEDUCTION * numberOfIrrfDependants;
      const irrfAmount = this.calculateIRRF(irrfBase, referenceYear);
      if (irrfAmount > 0) {
        const irrfItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'IRRF',
          description: 'IRRF - 13º Salário',
          amount: irrfAmount,
          isDeduction: true,
        });
        items.push(irrfItem);
      }

      // FGTS on full 13th salary (employer contribution)
      const fgtsAmount = Math.round(fullThirteenth * 0.08 * 100) / 100;
      if (fgtsAmount > 0) {
        const fgtsItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'FGTS',
          description: 'FGTS - 13º Salário (contribuição patronal)',
          amount: fgtsAmount,
          isDeduction: false,
        });
        items.push(fgtsItem);
      }
    }

    return items;
  }

  private calculateINSS(grossSalary: number, year: number): number {
    const table = getINSSTable(year);

    let inss = 0;
    let remainingSalary = grossSalary;
    let previousLimit = 0;

    for (const bracket of table.brackets) {
      if (remainingSalary <= 0) break;

      const bracketRange = bracket.limit - previousLimit;
      const taxableInBracket = Math.min(remainingSalary, bracketRange);

      inss += taxableInBracket * bracket.rate;
      remainingSalary -= taxableInBracket;
      previousLimit = bracket.limit;
    }

    return Math.min(inss, table.maxContribution);
  }

  private calculateIRRF(taxableBase: number, year: number): number {
    const table = getIRRFTable(year);

    if (taxableBase <= table.exemptLimit) return 0;

    for (const bracket of table.brackets) {
      if (taxableBase <= bracket.limit) {
        const irrf = taxableBase * bracket.rate - bracket.deduction;
        return Math.max(0, Math.round(irrf * 100) / 100);
      }
    }

    return 0;
  }
}
