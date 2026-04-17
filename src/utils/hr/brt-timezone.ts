/**
 * BRT (Brasília Time / UTC-3) timezone helpers for HR calculations.
 *
 * Brazilian labor law (CLT) expresses boundaries like the night shift window
 * (22:00-05:00), punch day, and DSR in civil local time. Server processes
 * usually run in UTC in production, so every read of hour/day/date from a
 * Date object must be converted to BRT first or calculations drift by three
 * hours (e.g. the 22:00 BRT boundary becomes 01:00 UTC).
 *
 * Brazil abandoned DST in 2019, so BRT is a fixed UTC-3 offset.
 */

const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

/**
 * Returns the hour (0-23) of a given instant as seen in BRT.
 */
export function getHourInBRT(date: Date): number {
  const brt = new Date(date.getTime() + BRT_OFFSET_MS);
  return brt.getUTCHours();
}

/**
 * Returns the day-of-week (0 Sunday - 6 Saturday) of a given instant in BRT.
 */
export function getDayOfWeekInBRT(date: Date): number {
  const brt = new Date(date.getTime() + BRT_OFFSET_MS);
  return brt.getUTCDay();
}

/**
 * Returns a YYYY-MM-DD key that represents the calendar day of a given
 * instant in BRT. Use this to group punches by "work day" consistently
 * regardless of server timezone.
 */
export function toBRTDateKey(date: Date): string {
  const brt = new Date(date.getTime() + BRT_OFFSET_MS);
  const year = brt.getUTCFullYear();
  const month = String(brt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(brt.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD BRT date key back into a Date representing midnight
 * BRT (03:00 UTC) of that day.
 */
export function fromBRTDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  // Midnight in BRT = 03:00 UTC of the same civil day
  return new Date(Date.UTC(year, month - 1, day) - BRT_OFFSET_MS);
}

/**
 * Returns true when the instant, observed in BRT, falls within the legal
 * urban night shift window (22:00 inclusive to 05:00 exclusive, wrapping
 * across midnight).
 */
export function isWithinNightShiftBRT(date: Date): boolean {
  const hour = getHourInBRT(date);
  return hour >= 22 || hour < 5;
}
