import type { RecurrenceUnit } from '@/entities/finance/finance-entry-types';

/**
 * Calculates the next date based on a recurrence unit and interval.
 *
 * @param baseDate - The starting date to calculate from
 * @param interval - The number of units between each recurrence
 * @param unit - The recurrence unit (DAILY, WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, SEMIANNUAL, ANNUAL)
 * @param multiplier - How many intervals to advance (defaults to 1)
 * @returns A new Date advanced by the specified amount
 */
export function calculateNextDate(
  baseDate: Date,
  interval: number,
  unit: RecurrenceUnit | string,
  multiplier = 1,
): Date {
  const date = new Date(baseDate);
  const totalInterval = interval * multiplier;

  switch (unit) {
    case 'DAILY':
      date.setUTCDate(date.getUTCDate() + totalInterval);
      break;
    case 'WEEKLY':
      date.setUTCDate(date.getUTCDate() + totalInterval * 7);
      break;
    case 'BIWEEKLY':
      date.setUTCDate(date.getUTCDate() + totalInterval * 14);
      break;
    case 'MONTHLY':
      date.setUTCMonth(date.getUTCMonth() + totalInterval);
      break;
    case 'QUARTERLY':
      date.setUTCMonth(date.getUTCMonth() + totalInterval * 3);
      break;
    case 'SEMIANNUAL':
      date.setUTCMonth(date.getUTCMonth() + totalInterval * 6);
      break;
    case 'ANNUAL':
      date.setUTCFullYear(date.getUTCFullYear() + totalInterval);
      break;
  }

  return date;
}
