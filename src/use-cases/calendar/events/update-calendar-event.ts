import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type CalendarEventDTO,
  calendarEventToDTO,
} from '@/mappers/calendar/calendar-event/calendar-event-to-dto';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';

interface UpdateCalendarEventRequest {
  id: string;
  tenantId: string;
  userId: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  startDate?: Date;
  endDate?: Date;
  isAllDay?: boolean;
  type?: string;
  visibility?: string;
  color?: string | null;
  rrule?: string | null;
  timezone?: string | null;
  metadata?: Record<string, unknown>;
}

interface UpdateCalendarEventResponse {
  event: CalendarEventDTO;
}

export class UpdateCalendarEventUseCase {
  constructor(private calendarEventsRepository: CalendarEventsRepository) {}

  async execute(
    request: UpdateCalendarEventRequest,
  ): Promise<UpdateCalendarEventResponse> {
    const existing = await this.calendarEventsRepository.findById(
      request.id,
      request.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Event not found');
    }

    if (existing.isSystemEvent) {
      throw new BadRequestError('System events cannot be edited');
    }

    if (existing.createdBy.toString() !== request.userId) {
      throw new BadRequestError('Only the event creator can update this event');
    }

    if (request.title !== undefined && request.title.trim().length === 0) {
      throw new BadRequestError('Event title cannot be empty');
    }

    // Validate date ordering using existing values as fallback
    const effectiveStartDate = request.startDate ?? existing.startDate;
    const effectiveEndDate = request.endDate ?? existing.endDate;

    if (effectiveEndDate <= effectiveStartDate) {
      throw new BadRequestError('End date must be after start date');
    }

    const updated = await this.calendarEventsRepository.update({
      id: request.id,
      tenantId: request.tenantId,
      title: request.title?.trim(),
      description: request.description,
      location: request.location,
      startDate: request.startDate,
      endDate: request.endDate,
      isAllDay: request.isAllDay,
      type: request.type,
      visibility: request.visibility,
      color: request.color,
      rrule: request.rrule,
      timezone: request.timezone,
      metadata: request.metadata,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Event not found');
    }

    return { event: calendarEventToDTO(updated) };
  }
}
