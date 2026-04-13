import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionInspectionPlan } from '@/entities/production/inspection-plan';
import { prisma } from '@/lib/prisma';
import type {
  InspectionPlansRepository,
  CreateInspectionPlanSchema,
  UpdateInspectionPlanSchema,
} from '../inspection-plans-repository';

function toDomain(raw: {
  id: string;
  operationRoutingId: string;
  inspectionType: string;
  description: string | null;
  sampleSize: number;
  aqlLevel: string | null;
  instructions: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ProductionInspectionPlan {
  return ProductionInspectionPlan.create(
    {
      operationRoutingId: new EntityID(raw.operationRoutingId),
      inspectionType: raw.inspectionType,
      description: raw.description ?? null,
      sampleSize: raw.sampleSize,
      aqlLevel: raw.aqlLevel ?? null,
      instructions: raw.instructions ?? null,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaInspectionPlansRepository
  implements InspectionPlansRepository
{
  async create(
    data: CreateInspectionPlanSchema,
  ): Promise<ProductionInspectionPlan> {
    const raw = await prisma.productionInspectionPlan.create({
      data: {
        operationRoutingId: data.operationRoutingId,
        inspectionType: data.inspectionType,
        description: data.description ?? null,
        sampleSize: data.sampleSize,
        aqlLevel: data.aqlLevel ?? null,
        instructions: data.instructions ?? null,
        isActive: data.isActive ?? true,
      },
    });

    return toDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<ProductionInspectionPlan | null> {
    const raw = await prisma.productionInspectionPlan.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByOperationRoutingId(
    operationRoutingId: string,
  ): Promise<ProductionInspectionPlan[]> {
    const records = await prisma.productionInspectionPlan.findMany({
      where: { operationRoutingId },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(toDomain);
  }

  async update(
    data: UpdateInspectionPlanSchema,
  ): Promise<ProductionInspectionPlan | null> {
    const updateData: {
      inspectionType?: string;
      description?: string | null;
      sampleSize?: number;
      aqlLevel?: string | null;
      instructions?: string | null;
      isActive?: boolean;
    } = {};

    if (data.inspectionType !== undefined)
      updateData.inspectionType = data.inspectionType;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.sampleSize !== undefined) updateData.sampleSize = data.sampleSize;
    if (data.aqlLevel !== undefined) updateData.aqlLevel = data.aqlLevel;
    if (data.instructions !== undefined)
      updateData.instructions = data.instructions;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const raw = await prisma.productionInspectionPlan.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionInspectionPlan.delete({
      where: { id: id.toString() },
    });
  }
}
