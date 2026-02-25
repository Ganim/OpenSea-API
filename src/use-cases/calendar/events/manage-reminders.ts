import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import type { EventParticipantsRepository } from '@/repositories/calendar/event-participants-repository';
import type { EventRemindersRepository } from '@/repositories/calendar/event-reminders-repository';

interface ManageRemindersRequest {
  eventId: string;
  tenantId: string;
  userId: string;
  reminders: { minutesBefore: number }[];
}

interface ManageRemindersResponse {
  count: number;
}

export class ManageRemindersUseCase {
  constructor(
    private calendarEventsRepository: CalendarEventsRepository,
    private eventParticipantsRepository: EventParticipantsRepository,
    private eventRemindersRepository: EventRemindersRepository,
  ) {}

  async execute(
    request: ManageRemindersRequest,
  ): Promise<ManageRemindersResponse> {
    const { eventId, tenantId, userId, reminders } = request;

    const event = await this.calendarEventsRepository.findById(eventId, tenantId);
    if (!event) {
      throw new ResourceNotFoundError('Event not found');
    }

    // Verify user is a participant
    const participant = await this.eventParticipantsRepository.findByEventAndUser(
      eventId,
      userId,
    );
    if (!participant) {
      throw new BadRequestError('You must be a participant to manage reminders');
    }

    // Delete existing reminders for this user on this event
    await this.eventRemindersRepository.deleteByEventAndUser(eventId, userId);

    // Create new reminders
    for (const reminder of reminders) {
      await this.eventRemindersRepository.create({
        tenantId,
        eventId,
        userId,
        minutesBefore: reminder.minutesBefore,
      });
    }

    return { count: reminders.length };
  }
}
