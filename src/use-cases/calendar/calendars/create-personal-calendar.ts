import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';
import {
  type CalendarDTO,
  calendarToDTO,
} from '@/mappers/calendar/calendar/calendar-to-dto';
import { resolveCalendarAccess } from '../helpers/resolve-calendar-access';

interface CreatePersonalCalendarRequest {
  tenantId: string;
  userId: string;
}

interface CreatePersonalCalendarResponse {
  calendar: CalendarDTO;
}

export class CreatePersonalCalendarUseCase {
  constructor(private calendarsRepository: CalendarsRepository) {}

  async execute(
    request: CreatePersonalCalendarRequest,
  ): Promise<CreatePersonalCalendarResponse> {
    const { tenantId, userId } = request;

    // Atomic find-or-create prevents race condition duplicates
    const calendar = await this.calendarsRepository.findOrCreatePersonal(
      tenantId,
      userId,
    );
    const access = resolveCalendarAccess({ calendar, userId });
    return { calendar: calendarToDTO(calendar, access) };
  }
}
