import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionDowntimeRecord } from '@/entities/production/downtime-record';
import { prisma } from '@/lib/prisma';
import type {
  DowntimeRecordsRepository,
  CreateDowntimeRecordSchema,
  UpdateDowntimeRecordSchema,
} from '../downtime-records-repository';

function toDomain(raw: {
  id: string;
  workstationId: string;
  downtimeReasonId: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  reportedById: string;
  notes: string | null;
  createdAt: Date;
}): ProductionDowntimeRecord {
  return ProductionDowntimeRecord.create(
    {
      workstationId: new EntityID(raw.workstationId),
      downtimeReasonId: new EntityID(raw.downtimeReasonId),
      startTime: raw.startTime,
      endTime: raw.endTime ?? null,
      durationMinutes: raw.durationMinutes ?? null,
      reportedById: new EntityID(raw.reportedById),
      notes: raw.notes ?? null,
      createdAt: raw.createdAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaDowntimeRecordsRepository
  implements DowntimeRecordsRepository
{
  async create(
    data: CreateDowntimeRecordSchema,
  ): Promise<ProductionDowntimeRecord> {
    const raw = await prisma.productionDowntimeRecord.create({
      data: {
        workstationId: data.workstationId,
        downtimeReasonId: data.downtimeReasonId,
        startTime: data.startTime,
        endTime: data.endTime ?? null,
        durationMinutes: data.durationMinutes ?? null,
        reportedById: data.reportedById,
        notes: data.notes ?? null,
      },
    });

    return toDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
  ): Promise<ProductionDowntimeRecord | null> {
    const raw = await prisma.productionDowntimeRecord.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByWorkstationId(
    workstationId: UniqueEntityID,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ProductionDowntimeRecord[]> {
    const where: {
      workstationId: string;
      startTime?: { gte?: Date; lte?: Date };
    } = {
      workstationId: workstationId.toString(),
    };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const records = await prisma.productionDowntimeRecord.findMany({
      where,
      orderBy: { startTime: 'desc' },
    });

    return records.map(toDomain);
  }

  async update(
    data: UpdateDowntimeRecordSchema,
  ): Promise<ProductionDowntimeRecord | null> {
    const updateData: {
      endTime?: Date | null;
      durationMinutes?: number | null;
      notes?: string | null;
    } = {};

    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.durationMinutes !== undefined)
      updateData.durationMinutes = data.durationMinutes;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const raw = await prisma.productionDowntimeRecord.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionDowntimeRecord.delete({
      where: { id: id.toString() },
    });
  }
}
