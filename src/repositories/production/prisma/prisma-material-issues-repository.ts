import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionMaterialIssue } from '@/entities/production/material-issue';
import { prisma } from '@/lib/prisma';
import type {
  MaterialIssuesRepository,
  CreateMaterialIssueSchema,
} from '../material-issues-repository';

function toDomain(raw: {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: unknown;
  batchNumber: string | null;
  issuedById: string;
  issuedAt: Date;
  notes: string | null;
}): ProductionMaterialIssue {
  return ProductionMaterialIssue.create(
    {
      productionOrderId: new EntityID(raw.productionOrderId),
      materialId: new EntityID(raw.materialId),
      warehouseId: new EntityID(raw.warehouseId),
      quantity: Number(raw.quantity),
      batchNumber: raw.batchNumber ?? null,
      issuedById: new EntityID(raw.issuedById),
      issuedAt: raw.issuedAt,
      notes: raw.notes ?? null,
    },
    new EntityID(raw.id),
  );
}

export class PrismaMaterialIssuesRepository
  implements MaterialIssuesRepository
{
  async create(
    data: CreateMaterialIssueSchema,
  ): Promise<ProductionMaterialIssue> {
    const raw = await prisma.productionMaterialIssue.create({
      data: {
        productionOrderId: data.productionOrderId,
        materialId: data.materialId,
        warehouseId: data.warehouseId,
        quantity: data.quantity,
        batchNumber: data.batchNumber ?? null,
        issuedById: data.issuedById,
        notes: data.notes ?? null,
      },
    });

    return toDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<ProductionMaterialIssue | null> {
    const raw = await prisma.productionMaterialIssue.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionMaterialIssue[]> {
    const records = await prisma.productionMaterialIssue.findMany({
      where: { productionOrderId: productionOrderId.toString() },
      orderBy: { issuedAt: 'desc' },
    });

    return records.map(toDomain);
  }
}
