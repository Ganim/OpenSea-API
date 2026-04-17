import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
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

/**
 * Brazilian national holidays (fixed dates only).
 * Floating holidays (Carnival, Easter, Corpus Christi) are not included.
 */
const BRAZILIAN_NATIONAL_HOLIDAYS: {
  month: number;
  day: number;
  name: string;
}[] = [
  { month: 1, day: 1, name: 'Confraternização Universal' },
  { month: 4, day: 21, name: 'Tiradentes' },
  { month: 5, day: 1, name: 'Dia do Trabalho' },
  { month: 9, day: 7, name: 'Independência do Brasil' },
  { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
  { month: 11, day: 2, name: 'Finados' },
  { month: 11, day: 15, name: 'Proclamação da República' },
  { month: 12, day: 25, name: 'Natal' },
];

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function findHoliday(
  date: Date,
): { month: number; day: number; name: string } | undefined {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return BRAZILIAN_NATIONAL_HOLIDAYS.find(
    (h) => h.month === month && h.day === day,
  );
}

function adjustToNextBusinessDay(date: Date): Date {
  const adjusted = new Date(date);
  while (isWeekend(adjusted) || findHoliday(adjusted)) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  return adjusted;
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

    for (let i = 0; i < count; i++) {
      const generatedDate =
        i === 0
          ? new Date(startDate)
          : calculateNextDate(startDate, 1, frequency, i);

      const dateIsWeekend = isWeekend(generatedDate);
      const holiday = findHoliday(generatedDate);
      const dateIsHoliday = !!holiday;

      const needsAdjustment =
        (skipWeekends && dateIsWeekend) || (skipHolidays && dateIsHoliday);

      const adjustedDate = needsAdjustment
        ? adjustToNextBusinessDay(generatedDate)
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
