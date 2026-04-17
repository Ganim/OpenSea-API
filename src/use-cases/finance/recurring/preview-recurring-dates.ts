import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  getBrazilianHolidays,
  getNextBusinessDay,
  isBusinessDay,
  type BrazilianHoliday,
} from '@/utils/brazilian-holidays';
import { calculateNextDate } from '@/utils/finance/calculate-next-date';

type RecurringFrequency =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'ANNUAL';

interface PreviewRecurringDatesUseCaseRequest {
  startDate: Date;
  frequency: RecurringFrequency;
  count?: number;
  skipWeekends?: boolean;
  skipHolidays?: boolean;
}

interface PreviewDateEntry {
  date: string;
  isWeekend: boolean;
  isHoliday: boolean;
  adjustedDate?: string;
  holidayName?: string;
}

interface PreviewRecurringDatesUseCaseResponse {
  dates: PreviewDateEntry[];
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function findHoliday(
  date: Date,
  holidaysByYear: Map<number, BrazilianHoliday[]>,
): BrazilianHoliday | undefined {
  const year = date.getFullYear();
  let holidays = holidaysByYear.get(year);
  if (!holidays) {
    holidays = getBrazilianHolidays(year);
    holidaysByYear.set(year, holidays);
  }
  return holidays.find(
    (h) =>
      h.date.getFullYear() === date.getFullYear() &&
      h.date.getMonth() === date.getMonth() &&
      h.date.getDate() === date.getDate(),
  );
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export class PreviewRecurringDatesUseCase {
  async execute(
    request: PreviewRecurringDatesUseCaseRequest,
  ): Promise<PreviewRecurringDatesUseCaseResponse> {
    const {
      startDate,
      frequency,
      count = 12,
      skipWeekends = false,
      skipHolidays = false,
    } = request;

    if (count < 1 || count > 60) {
      throw new BadRequestError(
        'A quantidade de datas deve estar entre 1 e 60',
      );
    }

    const dates: PreviewDateEntry[] = [];
    // Cache holidays per year so we don't recompute Easter 60 times in a loop
    const holidaysByYear = new Map<number, BrazilianHoliday[]>();

    for (let i = 0; i < count; i++) {
      const generatedDate =
        i === 0
          ? new Date(startDate)
          : calculateNextDate(startDate, 1, frequency, i);

      const dateIsWeekend = isWeekend(generatedDate);
      const holiday = findHoliday(generatedDate, holidaysByYear);
      const dateIsHoliday = !!holiday;

      const needsAdjustment =
        (skipWeekends && dateIsWeekend) ||
        (skipHolidays && dateIsHoliday) ||
        // If both flags are on, use the shared isBusinessDay check
        (skipWeekends && skipHolidays && !isBusinessDay(generatedDate));

      const adjustedDate = needsAdjustment
        ? getNextBusinessDay(generatedDate)
        : undefined;

      const previewEntry: PreviewDateEntry = {
        date: formatDateISO(generatedDate),
        isWeekend: dateIsWeekend,
        isHoliday: dateIsHoliday,
      };

      if (adjustedDate) {
        previewEntry.adjustedDate = formatDateISO(adjustedDate);
      }

      if (holiday) {
        previewEntry.holidayName = holiday.name;
      }

      dates.push(previewEntry);
    }

    return { dates };
  }
}
