import type { EventParticipant } from '@/entities/calendar/event-participant';
import type { CalendarEventParticipantDTO } from '../calendar-event/calendar-event-to-dto';

export function eventParticipantToDTO(
  participant: EventParticipant,
  options?: { userName?: string | null; userEmail?: string | null },
): CalendarEventParticipantDTO {
  return {
    id: participant.id.toString(),
    eventId: participant.eventId.toString(),
    userId: participant.userId.toString(),
    role: participant.role,
    status: participant.status,
    respondedAt: participant.respondedAt,
    userName: options?.userName ?? null,
    userEmail: options?.userEmail ?? null,
    createdAt: participant.createdAt,
    updatedAt: participant.updatedAt,
  };
}
