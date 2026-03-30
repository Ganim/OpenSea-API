/**
 * Redução de Férias por Faltas — CLT Art. 130
 *
 * Tabela de proporção:
 *   0–5  faltas injustificadas → 30 dias de férias
 *   6–14 faltas injustificadas → 24 dias de férias
 *  15–23 faltas injustificadas → 18 dias de férias
 *  24–32 faltas injustificadas → 12 dias de férias
 *  33+   faltas injustificadas → 0 dias (perde o direito)
 */

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

/**
 * Calculate vacation days based on unjustified absences in the acquisition period.
 *
 * @param unjustifiedAbsences - Number of unjustified absence days in the 12-month acquisition period
 * @returns Number of vacation days the employee is entitled to
 */
export function calculateVacationDays(unjustifiedAbsences: number): number {
  if (unjustifiedAbsences < 0) {
    throw new BadRequestError('Unjustified absences cannot be negative');
  }

  if (unjustifiedAbsences <= 5) return 30;
  if (unjustifiedAbsences <= 14) return 24;
  if (unjustifiedAbsences <= 23) return 18;
  if (unjustifiedAbsences <= 32) return 12;

  return 0; // Lost vacation right
}

/**
 * Get the absence range description for the given absence count.
 * Useful for displaying in the UI.
 */
export function getVacationDaysDescription(unjustifiedAbsences: number): string {
  const days = calculateVacationDays(unjustifiedAbsences);

  if (days === 0) {
    return 'Perdeu o direito a férias (mais de 32 faltas injustificadas)';
  }

  return `${days} dias de férias (${unjustifiedAbsences} faltas injustificadas)`;
}
