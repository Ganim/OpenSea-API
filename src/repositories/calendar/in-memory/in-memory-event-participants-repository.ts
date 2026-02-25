import { EventParticipant } from '@/entities/calendar/event-participant';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  EventParticipantsRepository,
  CreateEventParticipantSchema,
} from '../event-participants-repository';

export class InMemoryEventParticipantsRepository implements EventParticipantsRepository {
  public items: EventParticipant[] = [];

  async create(data: CreateEventParticipantSchema): Promise<EventParticipant> {
    const participant = EventParticipant.create({
      tenantId: new UniqueEntityID(data.tenantId),
      eventId: new UniqueEntityID(data.eventId),
      userId: new UniqueEntityID(data.userId),
      role: data.role,
      status: data.status,
    });
    this.items.push(participant);
    return participant;
  }

  async findByEventId(eventId: string): Promise<EventParticipant[]> {
    return this.items.filter((item) => item.eventId.toString() === eventId);
  }

  async findByUserId(userId: string): Promise<EventParticipant[]> {
    return this.items.filter((item) => item.userId.toString() === userId);
  }

  async findByEventAndUser(eventId: string, userId: string): Promise<EventParticipant | null> {
    return (
      this.items.find(
        (item) => item.eventId.toString() === eventId && item.userId.toString() === userId,
      ) ?? null
    );
  }

  async updateStatus(id: string, status: string): Promise<EventParticipant | null> {
    const participant = this.items.find((item) => item.id.toString() === id);
    if (!participant) return null;
    participant.respond(status);
    return participant;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id.toString() !== id);
  }

  async deleteByEventId(eventId: string): Promise<void> {
    this.items = this.items.filter((item) => item.eventId.toString() !== eventId);
  }
}
