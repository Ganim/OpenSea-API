import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionTimeEntry } from '@/entities/production/time-entry';
import type { ProductionTimeEntryType } from '@/entities/production/time-entry';
import { prisma } from '@/lib/prisma';
import type {
  TimeEntriesRepository,
  CreateTimeEntrySchema,
  UpdateTimeEntrySchema,
} from '../time-entries-repository';

function toDomain(raw: {
  id: string;
  jobCardId: string;
  operatorId: string;
  startTime: Date;
  endTime: Date | null;
  breakMinutes: number;
  entryType: string;
  notes: string | null;
  createdAt: Date;
}): ProductionTimeEntry {
  return ProductionTimeEntry.create(
    {
      jobCardId: new EntityID(raw.jobCardId),
      operatorId: new EntityID(raw.operatorId),
      startTime: raw.startTime,
      endTime: raw.endTime ?? null,
      breakMinutes: raw.breakMinutes,
      entryType: raw.entryType as ProductionTimeEntryType,
      notes: raw.notes ?? null,
      createdAt: raw.createdAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaTimeEntriesRepository implements TimeEntriesRepository {
  async create(data: CreateTimeEntrySchema): Promise<ProductionTimeEntry> {
    const raw = await prisma.productionTimeEntry.create({
      data: {
        jobCardId: data.jobCardId,
        operatorId: data.operatorId,
        startTime: data.startTime,
        endTime: data.endTime ?? null,
        breakMinutes: data.breakMinutes ?? 0,
        entryType: data.entryType ?? 'PRODUCTION',
        notes: data.notes ?? null,
      },
    });

    return toDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<ProductionTimeEntry | null> {
    const raw = await prisma.productionTimeEntry.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByJobCardId(
    jobCardId: UniqueEntityID,
  ): Promise<ProductionTimeEntry[]> {
    const records = await prisma.productionTimeEntry.findMany({
      where: { jobCardId: jobCardId.toString() },
      orderBy: { startTime: 'desc' },
    });

    return records.map(toDomain);
  }

  async update(
    data: UpdateTimeEntrySchema,
  ): Promise<ProductionTimeEntry | null> {
    const updateData: {
      endTime?: Date | null;
      breakMinutes?: number;
      notes?: string | null;
    } = {};

    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.breakMinutes !== undefined)
      updateData.breakMinutes = data.breakMinutes;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const raw = await prisma.productionTimeEntry.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionTimeEntry.delete({
      where: { id: id.toString() },
    });
  }
}
