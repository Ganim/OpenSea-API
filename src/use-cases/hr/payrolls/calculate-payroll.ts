import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { getINSSTable, getIRRFTable } from '@/constants/hr/tax-tables';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Absence } from '@/entities/hr/absence';
import type { Bonus } from '@/entities/hr/bonus';
import type { Deduction } from '@/entities/hr/deduction';
import type { Employee } from '@/entities/hr/employee';
import type { Overtime } from '@/entities/hr/overtime';
import type { Payroll } from '@/entities/hr/payroll';
import type { PayrollItem } from '@/entities/hr/payroll-item';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import { AbsencesRepository } from '@/repositories/hr/absences-repository';
import { BonusesRepository } from '@/repositories/hr/bonuses-repository';
import { DeductionsRepository } from '@/repositories/hr/deductions-repository';
import { EmployeesRepository } from '@/repositories/hr/employees-repository';
import { OvertimeRepository } from '@/repositories/hr/overtime-repository';
import { PayrollItemsRepository } from '@/repositories/hr/payroll-items-repository';
import { PayrollsRepository } from '@/repositories/hr/payrolls-repository';
import {
  calculateDSR,
  countBusinessDays,
  countSundaysAndHolidays,
} from './calculate-dsr';

/** IRRF dependant deduction per Brazilian tax law (R$189.59 per dependant) */
const IRRF_DEPENDANT_DEDUCTION = 189.59;

/** Standard monthly hours for CLT workers */
const MONTHLY_HOURS = 220;

/** Overtime rate for weekdays (50%) */
const OVERTIME_RATE_50 = 1.5;

/** Overtime rate for Sundays/holidays (100%) */
const OVERTIME_RATE_100 = 2.0;

/** Transport voucher employee contribution rate (6%) */
const TRANSPORT_VOUCHER_RATE = 0.06;

export interface NightShiftEntry {
  employeeId: string;
  clockIn: Date;
  clockOut: Date;
}

export interface CalculatePayrollRequest {
  tenantId: string;
  payrollId: string;
  processedBy: string;
  /** Number of IRRF dependants per employee (employeeId -> count) */
  irrfDependantsByEmployee?: Map<string, number>;
  /** Holiday dates in the payroll month (for DSR and overtime 100% calculation) */
  holidays?: Date[];
  /** Night shift entries per employee (for adicional noturno) */
  nightShiftEntries?: NightShiftEntry[];
  /** Employee IDs that opted into transport voucher */
  transportVoucherOptIn?: Set<string>;
  /** Hazard pay config per employee: employeeId -> grade (MIN/MED/MAX) */
  hazardPayByEmployee?: Map<string, 'MIN' | 'MED' | 'MAX'>;
  /** Danger pay employee IDs (periculosidade 30%) */
  dangerPayEmployees?: Set<string>;
}

export interface CalculatePayrollResponse {
  payroll: Payroll;
  items: PayrollItem[];
}

function groupByEmployeeId<T extends { employeeId: UniqueEntityID }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item.employeeId.toString();
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
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
    const {
      tenantId,
      payrollId,
      processedBy,
      irrfDependantsByEmployee,
      holidays = [],
      nightShiftEntries = [],
      transportVoucherOptIn = new Set<string>(),
      hazardPayByEmployee = new Map<string, 'MIN' | 'MED' | 'MAX'>(),
      dangerPayEmployees = new Set<string>(),
    } = request;

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

    const calculateAll = async (
      tx?: TransactionClient,
    ): Promise<CalculatePayrollResponse> => {
      // Get all active employees
      const employees = await this.employeesRepository.findManyActive(tenantId);

      // Batch prefetch: 4 queries instead of 4*N
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

      const [allOvertime, allAbsences, allBonuses, allDeductions] =
        await Promise.all([
          this.overtimeRepository.findMany(tenantId, {
            startDate: periodStart,
            endDate: periodEnd,
          }),
          this.absencesRepository.findMany(tenantId, {
            startDate: periodStart,
            endDate: periodEnd,
          }),
          this.bonusesRepository.findManyPending(tenantId),
          this.deductionsRepository.findManyPending(tenantId),
        ]);

      // Group by employeeId in memory
      const overtimeByEmployee = groupByEmployeeId(allOvertime);
      const absencesByEmployee = groupByEmployeeId(allAbsences);
      const bonusesByEmployee = groupByEmployeeId(allBonuses);
      const deductionsByEmployee = groupByEmployeeId(allDeductions);

      // Group night shift entries by employee
      const nightShiftsByEmployee = new Map<string, NightShiftEntry[]>();
      for (const entry of nightShiftEntries) {
        const group = nightShiftsByEmployee.get(entry.employeeId);
        if (group) {
          group.push(entry);
        } else {
          nightShiftsByEmployee.set(entry.employeeId, [entry]);
        }
      }

      const createdItems: PayrollItem[] = [];

      // Calculate for each employee using prefetched data
      for (const employee of employees) {
        const empId = employee.id.toString();
        const numberOfIrrfDependants =
          irrfDependantsByEmployee?.get(empId) ?? 0;
        const employeeItems = await this.calculateEmployeePayroll(
          payroll,
          employee,
          overtimeByEmployee.get(empId) ?? [],
          absencesByEmployee.get(empId) ?? [],
          bonusesByEmployee.get(empId) ?? [],
          deductionsByEmployee.get(empId) ?? [],
          numberOfIrrfDependants,
          {
            holidays,
            nightShiftEntries: nightShiftsByEmployee.get(empId) ?? [],
            hasTransportVoucher: transportVoucherOptIn.has(empId),
            hazardPayGrade: hazardPayByEmployee.get(empId),
            hasDangerPay: dangerPayEmployees.has(empId),
          },
          tx,
        );
        createdItems.push(...employeeItems);
      }

      // Calculate totals
      const { totalGross, totalDeductions } =
        await this.payrollItemsRepository.sumByPayroll(payroll.id, tx);

      // Finish calculation
      payroll.finishCalculation(totalGross, totalDeductions);

      // Save payroll
      await this.payrollsRepository.save(payroll, tx);

      return {
        payroll,
        items: createdItems,
      };
    };

    // Wrap all mutations in a transaction when available
    if (this.transactionManager) {
      return this.transactionManager.run((tx) => calculateAll(tx));
    }

    // Fallback without transaction (in-memory tests)
    return calculateAll();
  }

  private async calculateEmployeePayroll(
    payroll: Payroll,
    employee: Employee,
    overtimes: Overtime[],
    absences: Absence[],
    bonuses: Bonus[],
    deductions: Deduction[],
    numberOfIrrfDependants: number = 0,
    extras: {
      holidays: Date[];
      nightShiftEntries: NightShiftEntry[];
      hasTransportVoucher: boolean;
      hazardPayGrade?: 'MIN' | 'MED' | 'MAX';
      hasDangerPay: boolean;
    } = {
      holidays: [],
      nightShiftEntries: [],
      hasTransportVoucher: false,
      hasDangerPay: false,
    },
    tx?: TransactionClient,
  ): Promise<PayrollItem[]> {
    const items: PayrollItem[] = [];
    const employeeId = employee.id;

    if (!employee.status.isActive()) return items;

    const baseSalary = employee.baseSalary ?? 0;
    const hourlyRate = baseSalary / MONTHLY_HOURS;

    // 1. Base salary item
    const baseSalaryItem = await this.payrollItemsRepository.create({
      payrollId: payroll.id,
      employeeId,
      type: 'BASE_SALARY',
      description: 'Salário Base',
      amount: baseSalary,
      isDeduction: false,
    }, tx);
    items.push(baseSalaryItem);

    // 2. Calculate overtime (from prefetched data)
    let totalOvertimeValue = 0;

    for (const overtime of overtimes) {
      if (overtime.isApproved()) {
        // Determine overtime rate based on whether the date is a Sunday or holiday
        const isSundayOrHoliday = this.isSundayOrHoliday(
          overtime.date,
          extras.holidays,
        );
        const rate = isSundayOrHoliday ? OVERTIME_RATE_100 : OVERTIME_RATE_50;
        const overtimeAmount =
          Math.round(overtime.hours * hourlyRate * rate * 100) / 100;

        totalOvertimeValue += overtimeAmount;

        const itemType = isSundayOrHoliday ? 'OVERTIME_100' : 'OVERTIME';
        const rateLabel = isSundayOrHoliday ? '100%' : '50%';

        const overtimeItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: itemType,
          description: `Hora Extra ${rateLabel} (${overtime.hours}h)`,
          amount: overtimeAmount,
          isDeduction: false,
          referenceId: overtime.id.toString(),
          referenceType: 'overtime',
        }, tx);
        items.push(overtimeItem);
      }
    }

    // 3. Night shift premium (adicional noturno)
    if (extras.nightShiftEntries.length > 0) {
      let totalNightHours = 0;
      let totalNightPremium = 0;

      for (const entry of extras.nightShiftEntries) {
        const nightHours = this.calculateNightHoursForEntry(
          entry.clockIn,
          entry.clockOut,
        );
        const nightHourReduced =
          Math.round(nightHours * (60 / 52.5) * 10000) / 10000;
        totalNightHours += nightHourReduced;
        totalNightPremium +=
          Math.round(nightHourReduced * hourlyRate * 0.2 * 100) / 100;
      }

      if (totalNightPremium > 0) {
        const nightShiftItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'NIGHT_SHIFT',
          description: `Adicional Noturno (${totalNightHours.toFixed(2)}h reduzidas)`,
          amount: totalNightPremium,
          isDeduction: false,
        }, tx);
        items.push(nightShiftItem);
      }
    }

    // 4. DSR sobre horas extras
    if (totalOvertimeValue > 0) {
      const businessDays = countBusinessDays(
        payroll.referenceYear,
        payroll.referenceMonth,
        extras.holidays,
      );
      const sundaysAndHolidays = countSundaysAndHolidays(
        payroll.referenceYear,
        payroll.referenceMonth,
        extras.holidays,
      );

      const dsrAmount = calculateDSR(
        totalOvertimeValue,
        businessDays,
        sundaysAndHolidays,
      );

      if (dsrAmount > 0) {
        const dsrItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'DSR',
          description: 'DSR sobre Horas Extras',
          amount: dsrAmount,
          isDeduction: false,
        }, tx);
        items.push(dsrItem);
      }
    }

    // 5. Insalubridade (hazard pay) — based on minimum wage
    if (extras.hazardPayGrade) {
      const hazardAmount = this.calculateHazardPay(extras.hazardPayGrade);
      if (hazardAmount > 0) {
        const hazardItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'HAZARD_PAY',
          description: `Adicional de Insalubridade (${extras.hazardPayGrade === 'MIN' ? 'mínimo' : extras.hazardPayGrade === 'MED' ? 'médio' : 'máximo'}, tx)`,
          amount: hazardAmount,
          isDeduction: false,
        });
        items.push(hazardItem);
      }
    }

    // 6. Periculosidade (danger pay) — 30% of base salary (not cumulative with insalubridade)
    if (extras.hasDangerPay && !extras.hazardPayGrade) {
      const dangerAmount = this.calculateDangerPay(baseSalary);
      if (dangerAmount > 0) {
        const dangerItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'DANGER_PAY',
          description: 'Adicional de Periculosidade (30%)',
          amount: dangerAmount,
          isDeduction: false,
        }, tx);
        items.push(dangerItem);
      }
    }

    // 7. Calculate absences deductions (from prefetched data)
    for (const absence of absences) {
      if (!absence.isPaid && absence.isApproved()) {
        const dailyRate = baseSalary / 30;
        const deductionAmount =
          Math.round(dailyRate * absence.totalDays * 100) / 100;

        const absenceItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'OTHER_DEDUCTION',
          description: `Desconto Falta (${absence.totalDays} dias)`,
          amount: deductionAmount,
          isDeduction: true,
          referenceId: absence.id.toString(),
          referenceType: 'absence',
        }, tx);
        items.push(absenceItem);
      }
    }

    // 8. Apply bonuses (from prefetched data)
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
        }, tx);
        items.push(bonusItem);
      }
    }

    // 9. Apply deductions (from prefetched data)
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
      }, tx);
      items.push(deductionItem);
    }

    // 10. Transport voucher deduction (6% of base salary)
    if (extras.hasTransportVoucher && baseSalary > 0) {
      const vtDeduction =
        Math.round(baseSalary * TRANSPORT_VOUCHER_RATE * 100) / 100;
      if (vtDeduction > 0) {
        const vtItem = await this.payrollItemsRepository.create({
          payrollId: payroll.id,
          employeeId,
          type: 'TRANSPORT_VOUCHER',
          description: 'Vale-Transporte (6%)',
          amount: vtDeduction,
          isDeduction: true,
        }, tx);
        items.push(vtItem);
      }
    }

    // 11. Calculate statutory deductions (INSS, IRRF)
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
      }, tx);
      items.push(inssItem);
    }

    // IRRF calculation (deduct R$189.59 per IRRF dependant from base)
    const taxableBase =
      totalEarnings -
      inssAmount -
      IRRF_DEPENDANT_DEDUCTION * numberOfIrrfDependants;
    const irrfAmount = this.calculateIRRF(taxableBase, payroll.referenceYear);
    if (irrfAmount > 0) {
      const irrfItem = await this.payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId,
        type: 'IRRF',
        description: 'IRRF',
        amount: irrfAmount,
        isDeduction: true,
      }, tx);
      items.push(irrfItem);
    }

    // 12. FGTS calculation — employer contribution (8% of gross, NOT a deduction)
    const fgtsAmount = this.calculateFGTS(totalEarnings);
    if (fgtsAmount > 0) {
      const fgtsItem = await this.payrollItemsRepository.create({
        payrollId: payroll.id,
        employeeId,
        type: 'FGTS',
        description: 'FGTS (contribuição patronal)',
        amount: fgtsAmount,
        isDeduction: false,
      }, tx);
      items.push(fgtsItem);
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

  /**
   * FGTS = 8% of gross pay (base salary + overtime + bonuses + night shift + hazard pay)
   * This is an employer contribution and is NOT deducted from the employee's pay.
   */
  private calculateFGTS(grossSalary: number): number {
    const FGTS_RATE = 0.08;
    return Math.round(grossSalary * FGTS_RATE * 100) / 100;
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

  /**
   * Check if a date is a Sunday or falls on a holiday.
   */
  private isSundayOrHoliday(date: Date, holidays: Date[]): boolean {
    if (date.getDay() === 0) return true;

    return holidays.some(
      (h) =>
        h.getFullYear() === date.getFullYear() &&
        h.getMonth() === date.getMonth() &&
        h.getDate() === date.getDate(),
    );
  }

  /**
   * Calculate night hours (22:00-05:00) for a single clock entry.
   */
  private calculateNightHoursForEntry(clockIn: Date, clockOut: Date): number {
    if (clockOut <= clockIn) return 0;

    let nightMinutes = 0;
    const current = new Date(clockIn);
    const endTime = clockOut.getTime();
    const stepMs = 60 * 1000;

    while (current.getTime() < endTime) {
      const hour = current.getHours();
      if (hour >= 22 || hour < 5) {
        const remaining = endTime - current.getTime();
        const minuteFraction = Math.min(remaining, stepMs) / stepMs;
        nightMinutes += minuteFraction;
      }
      current.setTime(current.getTime() + stepMs);
    }

    return Math.round((nightMinutes / 60) * 10000) / 10000;
  }

  /**
   * Insalubridade: percentage of minimum wage based on grade.
   * MIN = 10%, MED = 20%, MAX = 40%
   */
  private calculateHazardPay(grade: 'MIN' | 'MED' | 'MAX'): number {
    const MINIMUM_WAGE_2024 = 1412.0;
    const rates = { MIN: 0.1, MED: 0.2, MAX: 0.4 };
    return Math.round(MINIMUM_WAGE_2024 * rates[grade] * 100) / 100;
  }

  /**
   * Periculosidade: 30% of base salary.
   */
  private calculateDangerPay(baseSalary: number): number {
    return Math.round(baseSalary * 0.3 * 100) / 100;
  }
}
