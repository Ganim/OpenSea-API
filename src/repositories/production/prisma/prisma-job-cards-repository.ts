import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionJobCardStatus } from '@/entities/production/job-card';
import { ProductionJobCard } from '@/entities/production/job-card';
import { prisma } from '@/lib/prisma';
import type {
  JobCardsRepository,
  CreateJobCardSchema,
  UpdateJobCardSchema,
} from '../job-cards-repository';

function toDomain(raw: {
  id: string;
  productionOrderId: string;
  operationRoutingId: string;
  workstationId: string | null;
  status: string;
  quantityPlanned: number;
  quantityCompleted: number;
  quantityScrapped: number;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  barcode: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProductionJobCard {
  return ProductionJobCard.create(
    {
      productionOrderId: new EntityID(raw.productionOrderId),
      operationRoutingId: new EntityID(raw.operationRoutingId),
      workstationId: raw.workstationId
        ? new EntityID(raw.workstationId)
        : null,
      status: raw.status as ProductionJobCardStatus,
      quantityPlanned: raw.quantityPlanned,
      quantityCompleted: raw.quantityCompleted,
      quantityScrapped: raw.quantityScrapped,
      scheduledStart: raw.scheduledStart ?? null,
      scheduledEnd: raw.scheduledEnd ?? null,
      actualStart: raw.actualStart ?? null,
      actualEnd: raw.actualEnd ?? null,
      barcode: raw.barcode ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaJobCardsRepository implements JobCardsRepository {
  async create(data: CreateJobCardSchema): Promise<ProductionJobCard> {
    const raw = await prisma.productionJobCard.create({
      data: {
        productionOrderId: data.productionOrderId,
        operationRoutingId: data.operationRoutingId,
        workstationId: data.workstationId ?? null,
        status: data.status ?? 'PENDING',
        quantityPlanned: data.quantityPlanned,
        quantityCompleted: data.quantityCompleted ?? 0,
        quantityScrapped: data.quantityScrapped ?? 0,
        scheduledStart: data.scheduledStart ?? null,
        scheduledEnd: data.scheduledEnd ?? null,
        actualStart: data.actualStart ?? null,
        actualEnd: data.actualEnd ?? null,
        barcode: data.barcode ?? null,
      },
    });

    return toDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<ProductionJobCard | null> {
    const raw = await prisma.productionJobCard.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionJobCard[]> {
    const records = await prisma.productionJobCard.findMany({
      where: { productionOrderId: productionOrderId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(toDomain);
  }

  async findManyByWorkstationId(
    workstationId: UniqueEntityID,
  ): Promise<ProductionJobCard[]> {
    const records = await prisma.productionJobCard.findMany({
      where: { workstationId: workstationId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(toDomain);
  }

  async update(data: UpdateJobCardSchema): Promise<ProductionJobCard | null> {
    const updateData: {
      operationRoutingId?: string;
      workstationId?: string | null;
      status?: string;
      quantityPlanned?: number;
      quantityCompleted?: number;
      quantityScrapped?: number;
      scheduledStart?: Date | null;
      scheduledEnd?: Date | null;
      actualStart?: Date | null;
      actualEnd?: Date | null;
      barcode?: string | null;
    } = {};

    if (data.operationRoutingId !== undefined)
      updateData.operationRoutingId = data.operationRoutingId;
    if (data.workstationId !== undefined)
      updateData.workstationId = data.workstationId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.quantityPlanned !== undefined)
      updateData.quantityPlanned = data.quantityPlanned;
    if (data.quantityCompleted !== undefined)
      updateData.quantityCompleted = data.quantityCompleted;
    if (data.quantityScrapped !== undefined)
      updateData.quantityScrapped = data.quantityScrapped;
    if (data.scheduledStart !== undefined)
      updateData.scheduledStart = data.scheduledStart;
    if (data.scheduledEnd !== undefined)
      updateData.scheduledEnd = data.scheduledEnd;
    if (data.actualStart !== undefined)
      updateData.actualStart = data.actualStart;
    if (data.actualEnd !== undefined) updateData.actualEnd = data.actualEnd;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;

    const raw = await prisma.productionJobCard.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionJobCard.delete({
      where: { id: id.toString() },
    });
  }
}
