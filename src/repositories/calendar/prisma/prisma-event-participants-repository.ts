import { prisma } from '@/lib/prisma';
import type { EventParticipant } from '@/entities/calendar/event-participant';
import { eventParticipantPrismaToDomain } from '@/mappers/calendar/event-participant/event-participant-prisma-to-domain';
import type {
  EventParticipantsRepository,
  CreateEventParticipantSchema,
} from '../event-participants-repository';

export class PrismaEventParticipantsRepository implements EventParticipantsRepository {
  async create(data: CreateEventParticipantSchema): Promise<EventParticipant> {
    const raw = await prisma.eventParticipant.create({
      data: {
        tenantId: data.tenantId,
        eventId: data.eventId,
        userId: data.userId,
        role: (data.role as any) ?? 'GUEST',
        status: (data.status as any) ?? 'PENDING',
      },
    });
    return eventParticipantPrismaToDomain(raw);
  }

  async findByEventId(eventId: string): Promise<EventParticipant[]> {
    const raws = await prisma.eventParticipant.findMany({
      where: { eventId },
    });
    return raws.map(eventParticipantPrismaToDomain);
  }

  async findByUserId(userId: string): Promise<EventParticipant[]> {
    const raws = await prisma.eventParticipant.findMany({
      where: { userId },
    });
    return raws.map(eventParticipantPrismaToDomain);
  }

  async findByEventAndUser(eventId: string, userId: string): Promise<EventParticipant | null> {
    const raw = await prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    return raw ? eventParticipantPrismaToDomain(raw) : null;
  }

  async updateStatus(id: string, status: string): Promise<EventParticipant | null> {
    const raw = await prisma.eventParticipant.update({
      where: { id },
      data: { status: status as any, respondedAt: new Date() },
    });
    return eventParticipantPrismaToDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await prisma.eventParticipant.delete({ where: { id } });
  }

  async deleteByEventId(eventId: string): Promise<void> {
    await prisma.eventParticipant.deleteMany({ where: { eventId } });
  }
}
