import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Payroll } from '@/entities/hr/payroll';
import type { PayrollItem } from '@/entities/hr/payroll-item';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';
import { BonusesRepository } from '@/repositories/hr/bonuses-repository';
import { DeductionsRepository } from '@/repositories/hr/deductions-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { OvertimeRepository } from '@/repositories/hr/overtime-repository';
import { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';

export interface CalculatePayrollRequest {
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
  ) {}

  async execute(
    request: CalculatePayrollRequest,
  ): Promise<CalculatePayrollResponse> {
    const { payrollId, processedBy } = request;

    // Find payroll
    const payroll = await this.payrollsRepository.findById(
      new UniqueEntityID(payrollId),
    );

    if (!payroll) {
      throw new ResourceNotFoundError('Folha de pagamento não encontrada');
    }

    // Check if payroll can be calculated
    if (!payroll.status.isDraft()) {
      throw new Error('Apenas folhas em rascunho podem ser calculadas');
    }

    // Start processing
    payroll.startProcessing(new UniqueEntityID(processedBy));

    // Get all active employees
    const employees = await this.employeesRepository.findManyActive();

    const createdItems: PayrollItem[] = [];

    // Calculate for each employee
    for (const employee of employees) {
      const employeeItems = await this.calculateEmployeePayroll(
        payroll,
        employee.id,
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
  }

  private async calculateEmployeePayroll(
    payroll: Payroll,
    employeeId: UniqueEntityID,
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
    const employee = await this.employeesRepository.findById(employeeId);
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
    const bonuses =
      await this.bonusesRepository.findManyPendingByEmployee(employeeId);

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
      await this.deductionsRepository.findManyPendingByEmployee(employeeId);

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

    // INSS calculation (simplified progressive rates)
    const inssAmount = this.calculateINSS(totalEarnings);
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

    // IRRF calculation (simplified)
    const taxableBase = totalEarnings - inssAmount;
    const irrfAmount = this.calculateIRRF(taxableBase);
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

  private calculateINSS(grossSalary: number): number {
    // Tabela INSS 2024 (simplificada)
    const brackets = [
      { limit: 1412.0, rate: 0.075 },
      { limit: 2666.68, rate: 0.09 },
      { limit: 4000.03, rate: 0.12 },
      { limit: 7786.02, rate: 0.14 },
    ];

    let inss = 0;
    let remainingSalary = grossSalary;
    let previousLimit = 0;

    for (const bracket of brackets) {
      if (remainingSalary <= 0) break;

      const bracketRange = bracket.limit - previousLimit;
      const taxableInBracket = Math.min(remainingSalary, bracketRange);

      inss += taxableInBracket * bracket.rate;
      remainingSalary -= taxableInBracket;
      previousLimit = bracket.limit;
    }

    // Cap at maximum contribution
    const maxContribution = 908.86; // Teto INSS 2024
    return Math.min(inss, maxContribution);
  }

  private calculateIRRF(taxableBase: number): number {
    // Tabela IRRF 2024 (simplificada)
    if (taxableBase <= 2259.2) return 0;

    const brackets = [
      { limit: 2826.65, rate: 0.075, deduction: 169.44 },
      { limit: 3751.05, rate: 0.15, deduction: 381.44 },
      { limit: 4664.68, rate: 0.225, deduction: 662.77 },
      { limit: Infinity, rate: 0.275, deduction: 896.0 },
    ];

    for (const bracket of brackets) {
      if (taxableBase <= bracket.limit) {
        const irrf = taxableBase * bracket.rate - bracket.deduction;
        return Math.max(0, irrf);
      }
    }

    return 0;
  }
}
