/**
 * Adicional Noturno — CLT Art. 73
 *
 * Urban workers: night period is 22:00 to 05:00
 * Night hour = 52min 30sec (reduced hour)
 * Factor: 60 / 52.5 = 1.142857
 * Premium: 20% over hourly rate
 */

/** Night hour reduction factor (60min / 52.5min) */
export const NIGHT_HOUR_FACTOR = 60 / 52.5; // 1.142857...

/** Night shift premium rate (20%) */
export const NIGHT_SHIFT_PREMIUM = 0.2;

/** Night period start hour (22:00) */
const NIGHT_START_HOUR = 22;

/** Night period end hour (05:00 next day) */
const NIGHT_END_HOUR = 5;

export interface NightShiftCalculation {
  /** Hours worked between 22:00-05:00 (clock hours) */
  nightHours: number;
  /** Night hours in reduced format (clock hours x 1.1428) */
  nightHourReduced: number;
  /** Premium amount: 20% additional over hourly rate for night hours */
  premium: number;
  /** Total amount: nightHourReduced x hourlyRate x 1.20 */
  totalAmount: number;
}

/**
 * Calculate the number of clock hours that overlap with the 22:00-05:00 night period.
 *
 * Handles shifts that cross midnight (e.g., 20:00 to 06:00) correctly.
 */
export function calculateNightHours(clockIn: Date, clockOut: Date): number {
  if (clockOut <= clockIn) return 0;

  const totalMs = clockOut.getTime() - clockIn.getTime();
  const totalHours = totalMs / (1000 * 60 * 60);

  // If the shift is longer than 24h, cap calculation at 24h
  if (totalHours > 24) {
    return 7; // Maximum night hours in a 24h period (22:00 to 05:00)
  }

  let nightMinutes = 0;
  const current = new Date(clockIn);

  // Iterate minute-by-minute for accuracy with edge cases
  // For performance, we step in 1-minute increments
  const endTime = clockOut.getTime();
  const stepMs = 60 * 1000; // 1 minute

  while (current.getTime() < endTime) {
    const hour = current.getHours();
    if (hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR) {
      // How much of this minute falls within the shift
      const remaining = endTime - current.getTime();
      const minuteFraction = Math.min(remaining, stepMs) / stepMs;
      nightMinutes += minuteFraction;
    }
    current.setTime(current.getTime() + stepMs);
  }

  return Math.round((nightMinutes / 60) * 10000) / 10000; // 4 decimal precision
}

/**
 * Calculate full night shift premium for an employee.
 *
 * @param clockIn - Clock-in time
 * @param clockOut - Clock-out time
 * @param hourlyRate - Employee's hourly rate (baseSalary / 220)
 * @returns Night shift calculation breakdown
 */
export function calculateNightShift(
  clockIn: Date,
  clockOut: Date,
  hourlyRate: number,
): NightShiftCalculation {
  const nightHours = calculateNightHours(clockIn, clockOut);

  // Reduced hours: 7 night hours = 8 regular hours
  const nightHourReduced =
    Math.round(nightHours * NIGHT_HOUR_FACTOR * 10000) / 10000;

  // Premium is 20% of the hourly rate for the reduced hours
  const premium =
    Math.round(nightHourReduced * hourlyRate * NIGHT_SHIFT_PREMIUM * 100) / 100;

  // Total amount = reduced hours × hourly rate × 1.20
  const totalAmount =
    Math.round(
      nightHourReduced * hourlyRate * (1 + NIGHT_SHIFT_PREMIUM) * 100,
    ) / 100;

  return {
    nightHours,
    nightHourReduced,
    premium,
    totalAmount,
  };
}
