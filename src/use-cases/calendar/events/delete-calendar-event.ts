import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';

interface DeleteCalendarEventRequest {
  id: string;
  tenantId: string;
  userId: string;
  hasManagePermission?: boolean;
}

export class DeleteCalendarEventUseCase {
  constructor(private calendarEventsRepository: CalendarEventsRepository) {}

  async execute(request: DeleteCalendarEventRequest): Promise<void> {
    const event = await this.calendarEventsRepository.findById(
      request.id,
      request.tenantId,
    );

    if (!event) {
      throw new ResourceNotFoundError('Event not found');
    }

    if (event.isSystemEvent) {
      throw new BadRequestError('System events cannot be deleted');
    }

    if (
      event.createdBy.toString() !== request.userId &&
      !request.hasManagePermission
    ) {
      throw new BadRequestError('Only the event creator can delete this event');
    }

    await this.calendarEventsRepository.softDelete(
      request.id,
      request.tenantId,
    );
  }
}
