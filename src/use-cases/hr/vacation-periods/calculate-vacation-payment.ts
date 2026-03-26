/**
 * Cálculo de Pagamento de Férias + 1/3 Constitucional
 *
 * - Férias = (salário base + média variáveis) / 30 × dias de férias
 * - 1/3 constitucional = valor das férias / 3
 * - Abono pecuniário = (salário base + média variáveis) / 30 × dias vendidos
 * - 1/3 sobre abono = abono pecuniário / 3
 * - INSS e IRRF incidem sobre (férias + 1/3) excluindo abono
 * - Prazo de pagamento: até 2 dias úteis antes do início das férias
 */

import { getINSSTable, getIRRFTable } from '@/constants/hr/tax-tables';

export interface VacationPaymentRequest {
  baseSalary: number;
  /** Average of variable earnings (overtime, bonuses, etc.) from the last 12 months */
  averageVariables: number;
  /** Vacation days to be taken */
  vacationDays: number;
  /** Days sold (abono pecuniário) — max 1/3 of total */
  soldDays: number;
  /** Vacation start date (for payment deadline calculation) */
  vacationStartDate: Date;
  /** Tax year for INSS/IRRF table lookup */
  taxYear: number;
  /** Number of IRRF dependants */
  irrfDependants?: number;
}

export interface VacationPaymentCalculation {
  baseSalary: number;
  averageVariables: number;
  vacationDays: number;
  soldDays: number;

  /** Daily rate = (baseSalary + averageVariables) / 30 */
  dailyRate: number;

  /** Vacation base = dailyRate × vacationDays */
  vacationBase: number;

  /** Constitutional third = vacationBase / 3 */
  constitutionalThird: number;

  /** Abono pecuniário = dailyRate × soldDays */
  abonoPecuniario: number;

  /** Third over abono = abonoPecuniario / 3 */
  abonoThird: number;

  /** Gross total = vacationBase + constitutionalThird + abonoPecuniario + abonoThird */
  grossTotal: number;

  /** INSS deduction (calculated over vacationBase + constitutionalThird only) */
  inssDeduction: number;

  /** IRRF deduction (calculated over vacationBase + constitutionalThird - INSS) */
  irrfDeduction: number;

  /** Net total = grossTotal - inssDeduction - irrfDeduction */
  netTotal: number;

  /** Payment deadline: 2 business days before vacation start */
  paymentDeadline: Date;
}

/** IRRF dependant deduction per Brazilian tax law */
const IRRF_DEPENDANT_DEDUCTION = 189.59;

/**
 * Calculate vacation payment with all legal components.
 */
export function calculateVacationPayment(
  request: VacationPaymentRequest,
): VacationPaymentCalculation {
  const {
    baseSalary,
    averageVariables,
    vacationDays,
    soldDays,
    vacationStartDate,
    taxYear,
    irrfDependants = 0,
  } = request;

  if (vacationDays <= 0) {
    throw new Error('Vacation days must be greater than zero');
  }

  if (soldDays < 0) {
    throw new Error('Sold days cannot be negative');
  }

  if (soldDays > Math.floor(vacationDays / 3) + soldDays) {
    // Max 1/3 of total vacation can be sold — total = vacationDays + soldDays
    throw new Error(
      'Abono pecuniário não pode exceder 1/3 do total de férias',
    );
  }

  const dailyRate = round((baseSalary + averageVariables) / 30);

  // Vacation base value
  const vacationBase = round(dailyRate * vacationDays);

  // Constitutional third (1/3)
  const constitutionalThird = round(vacationBase / 3);

  // Abono pecuniário (sold days)
  const abonoPecuniario = round(dailyRate * soldDays);

  // Third over abono
  const abonoThird = round(abonoPecuniario / 3);

  // Gross total
  const grossTotal = round(
    vacationBase + constitutionalThird + abonoPecuniario + abonoThird,
  );

  // INSS/IRRF base: only vacation + 1/3 (abono is exempt from tax)
  const taxableGross = round(vacationBase + constitutionalThird);

  // INSS calculation
  const inssDeduction = calculateINSS(taxableGross, taxYear);

  // IRRF calculation (taxable = gross - INSS - dependant deductions)
  const irrfBase = round(
    taxableGross - inssDeduction - IRRF_DEPENDANT_DEDUCTION * irrfDependants,
  );
  const irrfDeduction = calculateIRRF(irrfBase, taxYear);

  // Net total
  const netTotal = round(grossTotal - inssDeduction - irrfDeduction);

  // Payment deadline: 2 business days before vacation start
  const paymentDeadline = calculatePaymentDeadline(vacationStartDate);

  return {
    baseSalary,
    averageVariables,
    vacationDays,
    soldDays,
    dailyRate,
    vacationBase,
    constitutionalThird,
    abonoPecuniario,
    abonoThird,
    grossTotal,
    inssDeduction,
    irrfDeduction,
    netTotal,
    paymentDeadline,
  };
}

/**
 * Calculate INSS using progressive rates (same logic as payroll).
 */
function calculateINSS(grossSalary: number, year: number): number {
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

  return round(Math.min(inss, table.maxContribution));
}

/**
 * Calculate IRRF (same logic as payroll).
 */
function calculateIRRF(taxableBase: number, year: number): number {
  const table = getIRRFTable(year);

  if (taxableBase <= table.exemptLimit) return 0;

  for (const bracket of table.brackets) {
    if (taxableBase <= bracket.limit) {
      const irrf = taxableBase * bracket.rate - bracket.deduction;
      return round(Math.max(0, irrf));
    }
  }

  return 0;
}

/**
 * Calculate payment deadline: 2 business days before vacation start.
 * Skips weekends (Sat/Sun).
 */
function calculatePaymentDeadline(vacationStart: Date): Date {
  const deadline = new Date(vacationStart);
  let businessDaysBack = 0;

  while (businessDaysBack < 2) {
    deadline.setDate(deadline.getDate() - 1);
    const dayOfWeek = deadline.getDay();

    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDaysBack++;
    }
  }

  return deadline;
}

/**
 * Round to 2 decimal places (centavos).
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
