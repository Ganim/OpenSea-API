import { prisma } from '@/lib/prisma';
import type { Calendar } from '@/entities/calendar/calendar';
import { calendarPrismaToDomain } from '@/mappers/calendar/calendar/calendar-prisma-to-domain';
import type {
  CalendarsRepository,
  CreateCalendarSchema,
  UpdateCalendarSchema,
} from '../calendars-repository';
import type { Prisma, CalendarType } from '@prisma/generated/client.js';

export class PrismaCalendarsRepository implements CalendarsRepository {
  async create(data: CreateCalendarSchema): Promise<Calendar> {
    const raw = await prisma.calendar.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        color: data.color,
        type: data.type as CalendarType,
        ownerId: data.ownerId,
        systemModule: data.systemModule,
        isDefault: data.isDefault ?? false,
        settings: (data.settings as Prisma.InputJsonValue) ?? {},
        createdBy: data.createdBy,
      },
    });

    return calendarPrismaToDomain(raw);
  }

  async findById(id: string, tenantId: string): Promise<Calendar | null> {
    const raw = await prisma.calendar.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    return raw ? calendarPrismaToDomain(raw) : null;
  }

  async findPersonalByUser(
    userId: string,
    tenantId: string,
  ): Promise<Calendar | null> {
    const raw = await prisma.calendar.findFirst({
      where: {
        tenantId,
        type: 'PERSONAL',
        ownerId: userId,
        deletedAt: null,
      },
    });

    return raw ? calendarPrismaToDomain(raw) : null;
  }

  async findOrCreatePersonal(
    tenantId: string,
    userId: string,
  ): Promise<Calendar> {
    const raw = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.calendar.findFirst({
          where: {
            tenantId,
            type: 'PERSONAL',
            ownerId: userId,
            deletedAt: null,
          },
        });
        if (existing) return existing;

        return tx.calendar.create({
          data: {
            tenantId,
            name: 'Meu Calendário',
            color: '#3b82f6',
            type: 'PERSONAL',
            ownerId: userId,
            isDefault: true,
            settings: {},
            createdBy: userId,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );

    return calendarPrismaToDomain(raw);
  }

  async findByTeam(teamId: string, tenantId: string): Promise<Calendar[]> {
    const configs = await prisma.teamCalendarConfig.findMany({
      where: { teamId, tenantId },
      include: { calendar: true },
    });

    return configs
      .filter((c) => !c.calendar.deletedAt)
      .map((c) => calendarPrismaToDomain(c.calendar));
  }

  async findSystemByModule(
    module: string,
    tenantId: string,
  ): Promise<Calendar | null> {
    const raw = await prisma.calendar.findFirst({
      where: {
        tenantId,
        type: 'SYSTEM',
        systemModule: module,
        deletedAt: null,
      },
    });

    return raw ? calendarPrismaToDomain(raw) : null;
  }

  async listByUser(
    userId: string,
    tenantId: string,
    teamIds: string[],
  ): Promise<Calendar[]> {
    const where: Prisma.CalendarWhereInput = {
      tenantId,
      deletedAt: null,
      OR: [
        // Personal calendar
        { type: 'PERSONAL', ownerId: userId },
        // Team calendars
        ...(teamIds.length > 0
          ? [
              {
                type: 'TEAM' as const,
                teamCalendarConfig: {
                  some: { teamId: { in: teamIds } },
                },
              },
            ]
          : []),
        // System calendars
        { type: 'SYSTEM' as const },
      ],
    };

    const raws = await prisma.calendar.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return raws.map(calendarPrismaToDomain);
  }

  async update(data: UpdateCalendarSchema): Promise<Calendar | null> {
    const updateData: Prisma.CalendarUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.settings !== undefined)
      updateData.settings = data.settings as Prisma.InputJsonValue;

    const result = await prisma.calendar.updateMany({
      where: { id: data.id, tenantId: data.tenantId, deletedAt: null },
      data: updateData,
    });

    if (result.count === 0) return null;

    const updated = await prisma.calendar.findFirst({
      where: { id: data.id, tenantId: data.tenantId, deletedAt: null },
    });

    return updated ? calendarPrismaToDomain(updated) : null;
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await prisma.calendar.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
