import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { getINSSTable, getIRRFTable } from '@/constants/hr/tax-tables';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Payroll } from '@/entities/hr/payroll';
import type { PayrollItem } from '@/entities/hr/payroll-item';
import type { TransactionManager } from '@/lib/transaction-manager';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';
import { BonusesRepository } from '@/repositories/hr/bonuses-repository';
import { DeductionsRepository } from '@/repositories/hr/deductions-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { OvertimeRepository } from '@/repositories/hr/overtime-repository';
import { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface CalculatePayrollRequest {
  tenantId: string;
  payrollId: string;
  processedBy: string;
}

export interface CalculatePayrollResponse {
  payroll: Payroll;
  items: PayrollItem[];
}

export class CalculatePayrollUseCase {
  constructor(
    private payrollsRepository: PayrollsRepository,
    private payrollItemsRepository: PayrollItemsRepository,
    private employeesRepository: EmployeesRepository,
    private overtimeRepository: OvertimeRepository,
    private absencesRepository: AbsencesRepository,
    private bonusesRepository: BonusesRepository,
    private deductionsRepository: DeductionsRepository,
    private transactionManager?: TransactionManager,
  ) {}

  async execute(
    request: CalculatePayrollRequest,
  ): Promise<CalculatePayrollResponse> {
    const { tenantId, payrollId, processedBy } = request;

    // Find payroll
    const payroll = await this.payrollsRepository.findById(
      new UniqueEntityID(payrollId),
      tenantId,
    );

    if (!payroll) {
      throw new ResourceNotFoundError('Folha de pagamento não encontrada');
    }

    // Check if payroll can be calculated
    if (!payroll.status.isDraft()) {
      throw new BadRequestError(
        'Apenas folhas em rascunho podem ser calculadas',
      );
    }

    // Start processing
    payroll.startProcessing(new UniqueEntityID(processedBy));

    const calculateAll = async (): Promise<CalculatePayrollResponse> => {
      // Get all active employees
      const employees = await this.employeesRepository.findManyActive(tenantId);

      const createdItems: PayrollItem[] = [];

      // Calculate for each employee
      for (const employee of employees) {
        const employeeItems = await this.calculateEmployeePayroll(
          payroll,
          employee.id,
          tenantId,
        );
        createdItems.push(...employeeItems);
      }

      // Calculate totals
      const { totalGross, totalDeductions } =
        await this.payrollItemsRepository.sumByPayroll(payroll.id);

      // Finish calculation
      payroll.finishCalculation(totalGross, totalDeductions);

      // Save payroll
      await this.payrollsRepository.save(payroll);

      return {
        payroll,
        items: createdItems,
      };
    };

    // Wrap all mutations in a transaction when available
    if (this.transactionManager) {
      return this.transactionManager.run(async () => {
        return calculateAll();
      });
    }

    // Fallback without transaction (in-memory tests)
    return calculateAll();
  }

  private async calculateEmployeePayroll(
    payroll: Payroll,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<PayrollItem[]> {
    const items: PayrollItem[] = [];
    const periodStart = new Date(
      payroll.referenceYear,
      payroll.referenceMonth - 1,
      1,
    );
    const periodEnd = new Date(
      payroll.referenceYear,
      payroll.referenceMonth,
      0,
    );

    // 1. Get base salary from employee
    const employee = await this.employeesRepository.findById(
      employeeId,
      tenantId,
    );
    if (!employee || !employee.status.isActive()) return items;

    const baseSalary = employee.baseSalary;

    // Base salary item
    const baseSalaryItem = await this.payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId,
      type: 'BASE_SALARY',
      description: 'Salário Base',
      amount: baseSalary,
      isDeduction: false,
    });
    items.push(baseSalaryItem);

    // 2. Calculate overtime
    const overtimes =
      await this.overtimeRepository.findManyByEmployeeAndDateRange(
        employeeId,
        periodStart,
        periodEnd,
        tenantId,
      );

    for (const overtime of overtimes) {
      if (overtime.isApproved()) {
        // Calculate overtime amount (1.5x hourly rate)
        const hourlyRate = baseSalary / 220; // Monthly hours
        const overtimeAmount = overtime.hours * hourlyRate * 1.5;

        const overtimeItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'OVERTIME',
          description: `Hora Extra (${overtime.hours}h)`,
          amount: overtimeAmount,
          isDeduction: false,
          referenceId: overtime.id.toString(),
          referenceType: 'overtime',
        });
        items.push(overtimeItem);
      }
    }

    // 3. Calculate absences deductions
    const absences =
      await this.absencesRepository.findManyByEmployeeAndDateRange(
        employeeId,
        periodStart,
        periodEnd,
        tenantId,
      );

    for (const absence of absences) {
      if (!absence.isPaid && absence.isApproved()) {
        // Calculate daily rate
        const dailyRate = baseSalary / 30;
        const deductionAmount = dailyRate * absence.totalDays;

        const absenceItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'OTHER_DEDUCTION',
          description: `Desconto Falta (${absence.totalDays} dias)`,
          amount: deductionAmount,
          isDeduction: true,
          referenceId: absence.id.toString(),
          referenceType: 'absence',
        });
        items.push(absenceItem);
      }
    }

    // 4. Apply bonuses
    const bonuses = await this.bonusesRepository.findManyPendingByEmployee(
      employeeId,
      tenantId,
    );

    for (const bonus of bonuses) {
      if (!bonus.isPaid) {
        const bonusItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'BONUS',
          description: `Bônus: ${bonus.name}`,
          amount: bonus.amount,
          isDeduction: false,
          referenceId: bonus.id.toString(),
          referenceType: 'bonus',
        });
        items.push(bonusItem);
      }
    }

    // 5. Apply deductions
    const deductions =
      await this.deductionsRepository.findManyPendingByEmployee(
        employeeId,
        tenantId,
      );

    for (const deduction of deductions) {
      const deductionItem = await this.payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId,
        type: 'OTHER_DEDUCTION',
        description: deduction.name,
        amount: deduction.amount,
        isDeduction: true,
        referenceId: deduction.id.toString(),
        referenceType: 'deduction',
      });
      items.push(deductionItem);
    }

    // 6. Calculate statutory deductions (INSS, IRRF)
    const totalEarnings = items
      .filter((item) => !item.isDeduction)
      .reduce((sum, item) => sum + item.amount, 0);

    // INSS calculation (progressive rates from tax table)
    const inssAmount = this.calculateINSS(totalEarnings, payroll.referenceYear);
    if (inssAmount > 0) {
      const inssItem = await this.payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId,
        type: 'INSS',
        description: 'INSS',
        amount: inssAmount,
        isDeduction: true,
      });
      items.push(inssItem);
    }

    // IRRF calculation
    const taxableBase = totalEarnings - inssAmount;
    const irrfAmount = this.calculateIRRF(taxableBase, payroll.referenceYear);
    if (irrfAmount > 0) {
      const irrfItem = await this.payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId,
        type: 'IRRF',
        description: 'IRRF',
        amount: irrfAmount,
        isDeduction: true,
      });
      items.push(irrfItem);
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
        return Math.max(0, irrf);
      }
    }

    return 0;
  }
}
