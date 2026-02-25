import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import ical, { ICalCalendarMethod, ICalEventClass, ICalEventStatus } from 'ical-generator';

interface ExportCalendarEventsRequest {
  tenantId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  type?: string;
  includeSystemEvents?: boolean;
}

interface ExportCalendarEventsResponse {
  fileName: string;
  data: string;
  mimeType: string;
}

export class ExportCalendarEventsUseCase {
  constructor(private calendarEventsRepository: CalendarEventsRepository) {}

  async execute(
    request: ExportCalendarEventsRequest,
  ): Promise<ExportCalendarEventsResponse> {
    const { tenantId, userId, startDate, endDate } = request;

    // Validate date range - max 90 days
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 90) {
      throw new BadRequestError('Date range cannot exceed 90 days');
    }

    if (endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    const { events } = await this.calendarEventsRepository.findMany({
      tenantId,
      userId,
      startDate,
      endDate,
      type: request.type,
      includeSystemEvents: request.includeSystemEvents,
      limit: 1000,
    });

    const cal = ical({
      name: 'OpenSea Agenda',
      prodId: {
        company: 'OpenSea',
        product: 'Calendar',
        language: 'PT-BR',
      },
      method: ICalCalendarMethod.PUBLISH,
    });

    for (const event of events) {
      // Skip private events from other users
      if (event.isPrivate && event.createdBy.toString() !== userId) {
        continue;
      }

      const icalEvent = cal.createEvent({
        id: `${event.id.toString()}@opensea`,
        summary: event.title,
        description: event.description ?? undefined,
        location: event.location ?? undefined,
        start: event.startDate,
        end: event.endDate,
        allDay: event.isAllDay,
        created: event.createdAt,
        lastModified: event.updatedAt ?? undefined,
        status: ICalEventStatus.CONFIRMED,
      });

      // Set visibility/class
      if (event.visibility === 'PRIVATE') {
        icalEvent.class(ICalEventClass.PRIVATE);
      }

      // Add RRULE if recurring
      if (event.rrule) {
        const rruleStr = event.rrule.replace(/^RRULE:/, '');
        icalEvent.repeating(rruleStr);
      }

      // Add timezone if available
      if (event.timezone) {
        icalEvent.timezone(event.timezone);
      }
    }

    return {
      fileName: 'opensea-agenda.ics',
      data: cal.toString(),
      mimeType: 'text/calendar; charset=utf-8',
    };
  }
}
