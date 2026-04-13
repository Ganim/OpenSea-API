import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionMaterialReturn } from '@/entities/production/material-return';
import { prisma } from '@/lib/prisma';
import type {
  MaterialReturnsRepository,
  CreateMaterialReturnSchema,
} from '../material-returns-repository';

function toDomain(raw: {
  id: string;
  productionOrderId: string;
  materialId: string;
  warehouseId: string;
  quantity: unknown;
  reason: string | null;
  returnedById: string;
  returnedAt: Date;
}): ProductionMaterialReturn {
  return ProductionMaterialReturn.create(
    {
      productionOrderId: new EntityID(raw.productionOrderId),
      materialId: new EntityID(raw.materialId),
      warehouseId: new EntityID(raw.warehouseId),
      quantity: Number(raw.quantity),
      reason: raw.reason ?? null,
      returnedById: new EntityID(raw.returnedById),
      returnedAt: raw.returnedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaMaterialReturnsRepository
  implements MaterialReturnsRepository
{
  async create(
    data: CreateMaterialReturnSchema,
  ): Promise<ProductionMaterialReturn> {
    const raw = await prisma.productionMaterialReturn.create({
      data: {
        productionOrderId: data.productionOrderId,
        materialId: data.materialId,
        warehouseId: data.warehouseId,
        quantity: data.quantity,
        reason: data.reason ?? null,
        returnedById: data.returnedById,
      },
    });

    return toDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<ProductionMaterialReturn | null> {
    const raw = await prisma.productionMaterialReturn.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByProductionOrderId(
    productionOrderId: UniqueEntityID,
  ): Promise<ProductionMaterialReturn[]> {
    const records = await prisma.productionMaterialReturn.findMany({
      where: { productionOrderId: productionOrderId.toString() },
      orderBy: { returnedAt: 'desc' },
    });

    return records.map(toDomain);
  }
}
