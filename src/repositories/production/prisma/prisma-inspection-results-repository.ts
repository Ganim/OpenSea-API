import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { InspectionStatus } from '@/entities/production/inspection-result';
import { ProductionInspectionResult } from '@/entities/production/inspection-result';
import { prisma } from '@/lib/prisma';
import type {
  InspectionResultsRepository,
  CreateInspectionResultSchema,
  UpdateInspectionResultSchema,
} from '../inspection-results-repository';

function toDomain(raw: {
  id: string;
  inspectionPlanId: string;
  productionOrderId: string;
  inspectedById: string;
  inspectedAt: Date;
  sampleSize: number;
  defectsFound: number;
  status: string;
  notes: string | null;
  createdAt: Date;
}): ProductionInspectionResult {
  return ProductionInspectionResult.create(
    {
      inspectionPlanId: new EntityID(raw.inspectionPlanId),
      productionOrderId: new EntityID(raw.productionOrderId),
      inspectedById: new EntityID(raw.inspectedById),
      inspectedAt: raw.inspectedAt,
      sampleSize: raw.sampleSize,
      defectsFound: raw.defectsFound,
      status: raw.status as InspectionStatus,
      notes: raw.notes ?? null,
      createdAt: raw.createdAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaInspectionResultsRepository
  implements InspectionResultsRepository
{
  async create(
    data: CreateInspectionResultSchema,
  ): Promise<ProductionInspectionResult> {
    const raw = await prisma.productionInspectionResult.create({
      data: {
        inspectionPlanId: data.inspectionPlanId,
        productionOrderId: data.productionOrderId,
        inspectedById: data.inspectedById,
        sampleSize: data.sampleSize,
        defectsFound: data.defectsFound ?? 0,
        status: data.status ?? 'PENDING',
        notes: data.notes ?? null,
      },
    });

    return toDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
  ): Promise<ProductionInspectionResult | null> {
    const raw = await prisma.productionInspectionResult.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByOrderId(
    productionOrderId: string,
  ): Promise<ProductionInspectionResult[]> {
    const records = await prisma.productionInspectionResult.findMany({
      where: { productionOrderId },
      orderBy: { inspectedAt: 'desc' },
    });

    return records.map(toDomain);
  }

  async update(
    data: UpdateInspectionResultSchema,
  ): Promise<ProductionInspectionResult | null> {
    const updateData: {
      status?: string;
      defectsFound?: number;
      notes?: string | null;
    } = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.defectsFound !== undefined)
      updateData.defectsFound = data.defectsFound;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const raw = await prisma.productionInspectionResult.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionInspectionResult.delete({
      where: { id: id.toString() },
    });
  }
}
