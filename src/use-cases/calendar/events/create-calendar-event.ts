import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type CalendarEventDTO,
  calendarEventToDTO,
} from '@/mappers/calendar/calendar-event/calendar-event-to-dto';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';

interface CreateCalendarEventRequest {
  tenantId: string;
  userId: string;
  calendarId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startDate: Date;
  endDate: Date;
  isAllDay?: boolean;
  type?: string;
  visibility?: string;
  color?: string | null;
  rrule?: string | null;
  timezone?: string | null;
  participants?: { userId: string; role?: string }[];
  reminders?: { minutesBefore: number }[];
}

interface CreateCalendarEventResponse {
  event: CalendarEventDTO;
}

export class CreateCalendarEventUseCase {
  constructor(
    private calendarEventsRepository: CalendarEventsRepository,
    private calendarsRepository: CalendarsRepository,
  ) {}

  async execute(
    request: CreateCalendarEventRequest,
  ): Promise<CreateCalendarEventResponse> {
    const { title, startDate, endDate, tenantId, userId } = request;

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Event title is required');
    }

    if (title.length > 256) {
      throw new BadRequestError('Event title must be at most 256 characters');
    }

    if (endDate <= startDate) {
      throw new BadRequestError('End date must be after start date');
    }

    // Validate calendarId belongs to the same tenant
    const calendar = await this.calendarsRepository.findById(
      request.calendarId,
      tenantId,
    );

    if (!calendar) {
      throw new ResourceNotFoundError('Calendar not found');
    }

    // Build participants list - always include creator as OWNER
    const participants = [
      { userId, role: 'OWNER' },
      ...(request.participants ?? []).filter((p) => p.userId !== userId),
    ];

    // Build reminders for the creator
    const reminders = (request.reminders ?? []).map((r) => ({
      userId,
      minutesBefore: r.minutesBefore,
    }));

    const event = await this.calendarEventsRepository.create({
      tenantId,
      calendarId: request.calendarId,
      title: title.trim(),
      description: request.description,
      location: request.location,
      startDate,
      endDate,
      isAllDay: request.isAllDay,
      type: request.type,
      visibility: request.visibility,
      color: request.color,
      rrule: request.rrule,
      timezone: request.timezone,
      createdBy: userId,
      participants,
      reminders,
    });

    return { event: calendarEventToDTO(event) };
  }
}
