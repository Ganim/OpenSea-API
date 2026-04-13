import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { QualityHoldStatus } from '@/entities/production/quality-hold';
import { ProductionQualityHold } from '@/entities/production/quality-hold';
import { prisma } from '@/lib/prisma';
import type {
  QualityHoldsRepository,
  CreateQualityHoldSchema,
  ReleaseQualityHoldSchema,
} from '../quality-holds-repository';

function toDomain(raw: {
  id: string;
  productionOrderId: string;
  reason: string;
  status: string;
  holdById: string;
  holdAt: Date;
  releasedById: string | null;
  releasedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProductionQualityHold {
  return ProductionQualityHold.create(
    {
      productionOrderId: new EntityID(raw.productionOrderId),
      reason: raw.reason,
      status: raw.status as QualityHoldStatus,
      holdById: raw.holdById,
      holdAt: raw.holdAt,
      releasedById: raw.releasedById,
      releasedAt: raw.releasedAt,
      resolution: raw.resolution,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaQualityHoldsRepository implements QualityHoldsRepository {
  async create(data: CreateQualityHoldSchema): Promise<ProductionQualityHold> {
    const raw = await prisma.productionQualityHold.create({
      data: {
        productionOrderId: data.productionOrderId,
        reason: data.reason,
        holdById: data.holdById,
        status: 'ACTIVE',
      },
    });

    return toDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<ProductionQualityHold | null> {
    const raw = await prisma.productionQualityHold.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findMany(filters: {
    productionOrderId?: string;
    status?: QualityHoldStatus;
  }): Promise<ProductionQualityHold[]> {
    const where: {
      productionOrderId?: string;
      status?: string;
    } = {};

    if (filters.productionOrderId)
      where.productionOrderId = filters.productionOrderId;
    if (filters.status) where.status = filters.status;

    const records = await prisma.productionQualityHold.findMany({
      where,
      orderBy: { holdAt: 'desc' },
    });

    return records.map(toDomain);
  }

  async release(
    data: ReleaseQualityHoldSchema,
  ): Promise<ProductionQualityHold | null> {
    const raw = await prisma.productionQualityHold.update({
      where: { id: data.id.toString() },
      data: {
        status: 'RELEASED',
        releasedById: data.releasedById,
        releasedAt: new Date(),
        resolution: data.resolution,
      },
    });

    return toDomain(raw);
  }
}
