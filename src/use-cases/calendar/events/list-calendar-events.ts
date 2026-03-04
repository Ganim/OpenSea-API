import { createHash } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  type CalendarEventDTO,
  calendarEventToDTO,
} from '@/mappers/calendar/calendar-event/calendar-event-to-dto';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import { getHolidaysInRange } from '@/utils/brazilian-holidays';

const SYSTEM_UUID = '00000000-0000-0000-0000-000000000000';

function deterministicUUID(input: string): string {
  const bytes = createHash('md5').update(input).digest();
  // Set version 3 (MD5-based) per RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x30;
  // Set variant to RFC 4122
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

interface ListCalendarEventsRequest {
  tenantId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  type?: string;
  search?: string;
  includeSystemEvents?: boolean;
  calendarIds?: string[];
  page?: number;
  limit?: number;
}

interface ListCalendarEventsResponse {
  events: CalendarEventDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListCalendarEventsUseCase {
  constructor(private calendarEventsRepository: CalendarEventsRepository) {}

  async execute(
    request: ListCalendarEventsRequest,
  ): Promise<ListCalendarEventsResponse> {
    const { startDate, endDate } = request;

    // Validate date range - max 90 days
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 90) {
      throw new BadRequestError('Date range cannot exceed 90 days');
    }

    if (endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    const page = request.page ?? 1;
    const limit = request.limit ?? 500;

    const { events: eventsWithRelations, total } =
      await this.calendarEventsRepository.findManyWithRelations({
        tenantId: request.tenantId,
        userId: request.userId,
        startDate,
        endDate,
        type: request.type,
        search: request.search,
        includeSystemEvents: request.includeSystemEvents,
        calendarIds: request.calendarIds,
        page,
        limit,
      });

    const result: CalendarEventDTO[] = [];

    for (const {
      event,
      creatorName,
      participants,
      reminders,
    } of eventsWithRelations) {
      const dtoOptions = { creatorName, participants, reminders };

      if (event.isRecurring && event.rrule) {
        // Expand recurrence
        try {
          const { RRule } = await import('rrule');
          // Parse the rrule and use event.startDate as DTSTART
          // so recurring events (birthdays, weekly meetings, etc.)
          // expand from the correct date
          const rruleStr = event.rrule.replace(/^RRULE:/, '');
          const options = RRule.parseString(rruleStr);
          options.dtstart = event.startDate;
          const rule = new RRule(options);
          const occurrences = rule.between(startDate, endDate);

          for (const occurrence of occurrences) {
            result.push(
              calendarEventToDTO(event, {
                ...dtoOptions,
                occurrenceDate: occurrence,
              }),
            );
          }
        } catch {
          // If RRULE parsing fails, just include the original event
          result.push(calendarEventToDTO(event, dtoOptions));
        }
      } else {
        result.push(calendarEventToDTO(event, dtoOptions));
      }
    }

    // Inject Brazilian holidays (synthetic events, not persisted)
    const shouldIncludeHolidays =
      request.includeSystemEvents !== false &&
      (!request.type || request.type === 'HOLIDAY') &&
      !request.search;

    const holidays = shouldIncludeHolidays
      ? getHolidaysInRange(startDate, endDate)
      : [];

    if (shouldIncludeHolidays) {
      for (const holiday of holidays) {
        const dateStr = holiday.date.toISOString().slice(0, 10);
        const holidayEnd = new Date(holiday.date);
        holidayEnd.setHours(23, 59, 59, 999);

        result.push({
          id: deterministicUUID(`holiday-${dateStr}`),
          tenantId: request.tenantId,
          calendarId: null,
          title: holiday.name,
          description: null,
          location: null,
          startDate: holiday.date,
          endDate: holidayEnd,
          isAllDay: true,
          type: 'HOLIDAY',
          visibility: 'PUBLIC',
          color: null,
          rrule: null,
          timezone: null,
          systemSourceType: 'HOLIDAY',
          systemSourceId: dateStr,
          metadata: {},
          createdBy: SYSTEM_UUID,
          creatorName: 'Sistema',
          participants: [],
          reminders: [],
          isRecurring: false,
          occurrenceDate: null,
          deletedAt: null,
          createdAt: holiday.date,
          updatedAt: null,
        });
      }
    }

    // Sort by start date
    result.sort(
      (a, b) =>
        new Date(a.occurrenceDate ?? a.startDate).getTime() -
        new Date(b.occurrenceDate ?? b.startDate).getTime(),
    );

    return {
      events: result,
      meta: {
        total: total + (shouldIncludeHolidays ? holidays.length : 0),
        page,
        limit,
        pages: Math.ceil(
          (total + (shouldIncludeHolidays ? holidays.length : 0)) / limit,
        ),
      },
    };
  }
}
