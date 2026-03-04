import { prisma } from '@/lib/prisma';
import type { CalendarEvent } from '@/entities/calendar/calendar-event';
import {
  calendarEventPrismaToDomain,
  extractRelationsFromPrisma,
} from '@/mappers/calendar/calendar-event/calendar-event-prisma-to-domain';
import type {
  CalendarEventsRepository,
  CalendarEventWithRelations,
  CreateCalendarEventSchema,
  UpdateCalendarEventSchema,
  FindManyCalendarEventsOptions,
  FindManyCalendarEventsResult,
  FindManyWithRelationsResult,
} from '../calendar-events-repository';
import type {
  Prisma,
  EventType,
  EventVisibility,
  ParticipantRole,
  ParticipantStatus,
} from '@prisma/generated/client.js';

export class PrismaCalendarEventsRepository
  implements CalendarEventsRepository
{
  private readonly include = {
    creator: {
      select: {
        id: true,
        email: true,
        username: true,
        profile: { select: { name: true, surname: true } },
      },
    },
    participants: {
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: { select: { name: true, surname: true } },
          },
        },
      },
    },
    reminders: true,
  } as const;

  async create(data: CreateCalendarEventSchema): Promise<CalendarEvent> {
    const raw = await prisma.calendarEvent.create({
      data: {
        tenantId: data.tenantId,
        calendarId: data.calendarId,
        title: data.title,
        description: data.description,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        isAllDay: data.isAllDay ?? false,
        type: (data.type as EventType) ?? 'CUSTOM',
        visibility: (data.visibility as EventVisibility) ?? 'PUBLIC',
        color: data.color,
        rrule: data.rrule,
        timezone: data.timezone,
        systemSourceType: data.systemSourceType,
        systemSourceId: data.systemSourceId,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? {},
        createdBy: data.createdBy,
        participants: data.participants
          ? {
              create: data.participants.map((p) => ({
                tenantId: data.tenantId,
                userId: p.userId,
                role: (p.role as ParticipantRole) ?? 'GUEST',
                status: 'PENDING' as ParticipantStatus,
              })),
            }
          : undefined,
        reminders: data.reminders
          ? {
              create: data.reminders.map((r) => ({
                tenantId: data.tenantId,
                userId: r.userId,
                minutesBefore: r.minutesBefore,
              })),
            }
          : undefined,
      },
      include: this.include,
    });

    return calendarEventPrismaToDomain(raw);
  }

  async findById(id: string, tenantId: string): Promise<CalendarEvent | null> {
    const raw = await prisma.calendarEvent.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: this.include,
    });

    return raw ? calendarEventPrismaToDomain(raw) : null;
  }

  async findByIdWithRelations(
    id: string,
    tenantId: string,
  ): Promise<CalendarEventWithRelations | null> {
    const raw = await prisma.calendarEvent.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: this.include,
    });

    if (!raw) return null;

    const event = calendarEventPrismaToDomain(raw);
    const { creatorName, participants, reminders } =
      extractRelationsFromPrisma(raw);

    return { event, creatorName, participants, reminders };
  }

  async findMany(
    options: FindManyCalendarEventsOptions,
  ): Promise<FindManyCalendarEventsResult> {
    const where: Prisma.CalendarEventWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
      startDate: { lte: options.endDate },
      endDate: { gte: options.startDate },
    };

    if (options.type) {
      where.type = options.type as EventType;
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (!options.includeSystemEvents) {
      where.systemSourceType = null;
    }

    if (options.calendarIds && options.calendarIds.length > 0) {
      where.calendarId = { in: options.calendarIds };
    }

    const page = options.page ?? 1;
    const limit = options.limit ?? 500;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        include: this.include,
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.calendarEvent.count({ where }),
    ]);

    // Post-filter private events
    const filtered = events
      .filter((event) => {
        if (event.visibility === 'PUBLIC') return true;
        if (event.createdBy === options.userId) return true;
        return event.participants.some((p) => p.userId === options.userId);
      })
      .map(calendarEventPrismaToDomain);

    return { events: filtered, total };
  }

  async findManyWithRelations(
    options: FindManyCalendarEventsOptions,
  ): Promise<FindManyWithRelationsResult> {
    const where: Prisma.CalendarEventWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
      startDate: { lte: options.endDate },
      endDate: { gte: options.startDate },
    };

    if (options.type) {
      where.type = options.type as EventType;
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    if (!options.includeSystemEvents) {
      where.systemSourceType = null;
    }

    if (options.calendarIds && options.calendarIds.length > 0) {
      where.calendarId = { in: options.calendarIds };
    }

    const page = options.page ?? 1;
    const limit = options.limit ?? 500;
    const skip = (page - 1) * limit;

    const [rawEvents, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        include: this.include,
        orderBy: { startDate: 'asc' },
        skip,
        take: limit,
      }),
      prisma.calendarEvent.count({ where }),
    ]);

    // Post-filter private events and map with relations
    const events = rawEvents
      .filter((event) => {
        if (event.visibility === 'PUBLIC') return true;
        if (event.createdBy === options.userId) return true;
        return event.participants.some((p) => p.userId === options.userId);
      })
      .map((raw) => {
        const event = calendarEventPrismaToDomain(raw);
        const { creatorName, participants, reminders } =
          extractRelationsFromPrisma(raw);
        return { event, creatorName, participants, reminders };
      });

    return { events, total };
  }

  async findBySystemSource(
    tenantId: string,
    sourceType: string,
    sourceId: string,
  ): Promise<CalendarEvent | null> {
    const raw = await prisma.calendarEvent.findFirst({
      where: {
        tenantId,
        systemSourceType: sourceType,
        systemSourceId: sourceId,
        deletedAt: null,
      },
      include: this.include,
    });

    return raw ? calendarEventPrismaToDomain(raw) : null;
  }

  async update(data: UpdateCalendarEventSchema): Promise<CalendarEvent | null> {
    const updateData: Prisma.CalendarEventUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.isAllDay !== undefined) updateData.isAllDay = data.isAllDay;
    if (data.type !== undefined) updateData.type = data.type as EventType;
    if (data.visibility !== undefined)
      updateData.visibility = data.visibility as EventVisibility;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.rrule !== undefined) updateData.rrule = data.rrule;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.metadata !== undefined)
      updateData.metadata = data.metadata as Prisma.InputJsonValue;

    const raw = await prisma.calendarEvent.updateMany({
      where: { id: data.id, tenantId: data.tenantId, deletedAt: null },
      data: updateData,
    });

    if (raw.count === 0) return null;

    const updated = await prisma.calendarEvent.findFirst({
      where: { id: data.id, tenantId: data.tenantId, deletedAt: null },
      include: this.include,
    });

    if (!updated) return null;

    return calendarEventPrismaToDomain(updated);
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await prisma.calendarEvent.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
