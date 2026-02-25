import type { EventParticipant } from '@/entities/calendar/event-participant';

export interface CreateEventParticipantSchema {
  tenantId: string;
  eventId: string;
  userId: string;
  role?: string;
  status?: string;
}

export interface EventParticipantsRepository {
  create(data: CreateEventParticipantSchema): Promise<EventParticipant>;
  findByEventId(eventId: string): Promise<EventParticipant[]>;
  findByUserId(userId: string): Promise<EventParticipant[]>;
  findByEventAndUser(eventId: string, userId: string): Promise<EventParticipant | null>;
  updateStatus(id: string, status: string): Promise<EventParticipant | null>;
  delete(id: string): Promise<void>;
  deleteByEventId(eventId: string): Promise<void>;
}
