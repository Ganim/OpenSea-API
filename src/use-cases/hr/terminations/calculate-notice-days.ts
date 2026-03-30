import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

/**
 * Aviso Prévio Proporcional — Lei 12.506/2011
 *
 * Base: 30 dias
 * Acréscimo: 3 dias por ano de serviço na mesma empresa
 * Limite máximo: 90 dias
 *
 * Exemplo:
 *   0 anos → 30 dias
 *   1 ano  → 33 dias
 *   5 anos → 45 dias
 *  20 anos → 90 dias (cap)
 */

/**
 * Calculate the number of notice days based on length of service.
 *
 * Per Lei 12.506/2011:
 * - Base: 30 days
 * - Additional: 3 days per year of service
 * - Maximum: 90 days
 *
 * @param hireDate - Employee hire date
 * @param terminationDate - Date of termination
 * @returns Number of notice days (30–90)
 */
export function calculateNoticeDays(
  hireDate: Date,
  terminationDate: Date,
): number {
  if (terminationDate < hireDate) {
    throw new BadRequestError(
      'Termination date cannot be before hire date',
    );
  }

  const years = differenceInFullYears(hireDate, terminationDate);
  const days = 30 + years * 3;

  return Math.min(days, 90);
}

/**
 * Calculate the monetary value of the proportional notice period.
 *
 * @param baseSalary - Employee base salary
 * @param noticeDays - Number of notice days (from calculateNoticeDays)
 * @returns Monetary value of the notice period
 */
export function calculateNoticeValue(
  baseSalary: number,
  noticeDays: number,
): number {
  const dailyRate = baseSalary / 30;
  return Math.round(dailyRate * noticeDays * 100) / 100;
}

/**
 * Get a description of the notice period calculation.
 *
 * @param hireDate - Employee hire date
 * @param terminationDate - Date of termination
 * @returns Human-readable description
 */
export function getNoticeDaysDescription(
  hireDate: Date,
  terminationDate: Date,
): string {
  const years = differenceInFullYears(hireDate, terminationDate);
  const days = calculateNoticeDays(hireDate, terminationDate);

  if (years === 0) {
    return `${days} dias (base, menos de 1 ano de serviço)`;
  }

  const additional = days - 30;
  return `${days} dias (30 base + ${additional} proporcional — ${years} anos de serviço)`;
}

/**
 * Calculate the difference in full years between two dates.
 */
function differenceInFullYears(startDate: Date, endDate: Date): number {
  let years = endDate.getFullYear() - startDate.getFullYear();

  const monthDiff = endDate.getMonth() - startDate.getMonth();
  const dayDiff = endDate.getDate() - startDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years--;
  }

  return Math.max(0, years);
}
