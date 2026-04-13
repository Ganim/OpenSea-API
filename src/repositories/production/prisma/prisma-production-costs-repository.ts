import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionCostType } from '@/entities/production/production-cost';
import { ProductionCost } from '@/entities/production/production-cost';
import { prisma } from '@/lib/prisma';
import type {
  ProductionCostsRepository,
  CreateProductionCostSchema,
  UpdateProductionCostSchema,
} from '../production-costs-repository';

function toDomain(raw: {
  id: string;
  productionOrderId: string;
  costType: string;
  description: string | null;
  plannedAmount: { toNumber(): number } | number;
  actualAmount: { toNumber(): number } | number;
  varianceAmount: { toNumber(): number } | number;
  createdAt: Date;
  updatedAt: Date;
}): ProductionCost {
  return ProductionCost.create(
    {
      productionOrderId: new EntityID(raw.productionOrderId),
      costType: raw.costType as ProductionCostType,
      description: raw.description,
      plannedAmount: Number(raw.plannedAmount),
      actualAmount: Number(raw.actualAmount),
      varianceAmount: Number(raw.varianceAmount),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaProductionCostsRepository
  implements ProductionCostsRepository
{
  async create(data: CreateProductionCostSchema): Promise<ProductionCost> {
    const raw = await prisma.productionCost.create({
      data: {
        productionOrderId: data.productionOrderId,
        costType: data.costType,
        description: data.description ?? null,
        plannedAmount: data.plannedAmount,
        actualAmount: data.actualAmount,
        varianceAmount: data.varianceAmount,
      },
    });

    return toDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<ProductionCost | null> {
    const raw = await prisma.productionCost.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) return null;

    return toDomain(raw);
  }

  async findManyByOrderId(
    productionOrderId: string,
  ): Promise<ProductionCost[]> {
    const records = await prisma.productionCost.findMany({
      where: { productionOrderId },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(toDomain);
  }

  async update(
    data: UpdateProductionCostSchema,
  ): Promise<ProductionCost | null> {
    const updateData: Record<string, unknown> = {};

    if (data.costType !== undefined) updateData.costType = data.costType;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.plannedAmount !== undefined)
      updateData.plannedAmount = data.plannedAmount;
    if (data.actualAmount !== undefined)
      updateData.actualAmount = data.actualAmount;
    if (data.varianceAmount !== undefined)
      updateData.varianceAmount = data.varianceAmount;

    const raw = await prisma.productionCost.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionCost.delete({
      where: { id: id.toString() },
    });
  }
}
