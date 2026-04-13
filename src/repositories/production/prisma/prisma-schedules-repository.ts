import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionSchedule } from '@/entities/production/schedule';
import type { ScheduleEntryStatus } from '@/entities/production/schedule-entry';
import { ProductionScheduleEntry } from '@/entities/production/schedule-entry';
import { prisma } from '@/lib/prisma';
import type {
  SchedulesRepository,
  CreateScheduleSchema,
  CreateScheduleEntrySchema,
  UpdateScheduleEntrySchema,
} from '../schedules-repository';

function scheduleToDomain(raw: {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ProductionSchedule {
  return ProductionSchedule.create(
    {
      tenantId: new EntityID(raw.tenantId),
      name: raw.name,
      description: raw.description,
      startDate: raw.startDate,
      endDate: raw.endDate,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

function entryToDomain(raw: {
  id: string;
  scheduleId: string;
  productionOrderId: string | null;
  workstationId: string | null;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string;
  color: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProductionScheduleEntry {
  return ProductionScheduleEntry.create(
    {
      scheduleId: new EntityID(raw.scheduleId),
      productionOrderId: raw.productionOrderId
        ? new EntityID(raw.productionOrderId)
        : null,
      workstationId: raw.workstationId
        ? new EntityID(raw.workstationId)
        : null,
      title: raw.title,
      startDate: raw.startDate,
      endDate: raw.endDate,
      status: raw.status as ScheduleEntryStatus,
      color: raw.color,
      notes: raw.notes,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaSchedulesRepository implements SchedulesRepository {
  // =========================================================================
  // Schedule
  // =========================================================================

  async createSchedule(data: CreateScheduleSchema): Promise<ProductionSchedule> {
    const raw = await prisma.productionSchedule.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    return scheduleToDomain(raw);
  }

  async findScheduleById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionSchedule | null> {
    const raw = await prisma.productionSchedule.findUnique({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!raw) return null;

    return scheduleToDomain(raw);
  }

  async findManySchedules(tenantId: string): Promise<ProductionSchedule[]> {
    const records = await prisma.productionSchedule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(scheduleToDomain);
  }

  async deleteSchedule(id: UniqueEntityID): Promise<void> {
    await prisma.productionSchedule.delete({
      where: { id: id.toString() },
    });
  }

  // =========================================================================
  // Schedule Entry
  // =========================================================================

  async createEntry(
    data: CreateScheduleEntrySchema,
  ): Promise<ProductionScheduleEntry> {
    const raw = await prisma.productionScheduleEntry.create({
      data: {
        scheduleId: data.scheduleId,
        productionOrderId: data.productionOrderId ?? null,
        workstationId: data.workstationId ?? null,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        color: data.color ?? null,
        notes: data.notes ?? null,
      },
    });

    return entryToDomain(raw);
  }

  async findEntryById(
    id: UniqueEntityID,
  ): Promise<ProductionScheduleEntry | null> {
    const raw = await prisma.productionScheduleEntry.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) return null;

    return entryToDomain(raw);
  }

  async findManyEntries(
    scheduleId: string,
    filters?: { startDate?: Date; endDate?: Date },
  ): Promise<ProductionScheduleEntry[]> {
    const where: Record<string, unknown> = { scheduleId };

    if (filters?.startDate || filters?.endDate) {
      where.OR = [
        {
          startDate: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {}),
          },
        },
        {
          endDate: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {}),
          },
        },
      ];
    }

    const records = await prisma.productionScheduleEntry.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return records.map(entryToDomain);
  }

  async updateEntry(
    data: UpdateScheduleEntrySchema,
  ): Promise<ProductionScheduleEntry | null> {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.workstationId !== undefined)
      updateData.workstationId = data.workstationId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const raw = await prisma.productionScheduleEntry.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return entryToDomain(raw);
  }

  async deleteEntry(id: UniqueEntityID): Promise<void> {
    await prisma.productionScheduleEntry.delete({
      where: { id: id.toString() },
    });
  }
}
