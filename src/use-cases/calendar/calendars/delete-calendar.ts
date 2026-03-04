import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';

interface DeleteCalendarRequest {
  calendarId: string;
  tenantId: string;
  userId: string;
  teamRole?: string | null;
}

export class DeleteCalendarUseCase {
  constructor(private calendarsRepository: CalendarsRepository) {}

  async execute(request: DeleteCalendarRequest): Promise<void> {
    const { calendarId, tenantId, teamRole } = request;

    const calendar = await this.calendarsRepository.findById(
      calendarId,
      tenantId,
    );
    if (!calendar) {
      throw new ResourceNotFoundError();
    }

    if (calendar.isPersonal) {
      throw new BadRequestError('Personal calendars cannot be deleted');
    }

    if (calendar.isSystem) {
      throw new BadRequestError('System calendars cannot be deleted');
    }

    // Only team OWNER can delete team calendars
    if (calendar.isTeam && teamRole !== 'OWNER') {
      throw new ForbiddenError();
    }

    await this.calendarsRepository.softDelete(calendarId, tenantId);
  }
}
