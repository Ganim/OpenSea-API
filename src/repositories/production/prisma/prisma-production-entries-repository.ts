import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionEntry } from '@/entities/production/production-entry';
import { prisma } from '@/lib/prisma';
import type {
  ProductionEntriesRepository,
  CreateProductionEntrySchema,
} from '../production-entries-repository';

function toDomain(raw: {
  id: string;
  jobCardId: string;
  operatorId: string;
  quantityGood: { toNumber(): number } | number;
  quantityScrapped: { toNumber(): number } | number;
  quantityRework: { toNumber(): number } | number;
  enteredAt: Date;
  notes: string | null;
}): ProductionEntry {
  return ProductionEntry.create(
    {
      jobCardId: new EntityID(raw.jobCardId),
      operatorId: new EntityID(raw.operatorId),
      quantityGood: Number(raw.quantityGood),
      quantityScrapped: Number(raw.quantityScrapped),
      quantityRework: Number(raw.quantityRework),
      enteredAt: raw.enteredAt,
      notes: raw.notes ?? null,
    },
    new EntityID(raw.id),
  );
}

export class PrismaProductionEntriesRepository
  implements ProductionEntriesRepository
{
  async create(data: CreateProductionEntrySchema): Promise<ProductionEntry> {
    const raw = await prisma.productionEntry.create({
      data: {
        jobCardId: data.jobCardId,
        operatorId: data.operatorId,
        quantityGood: data.quantityGood,
        quantityScrapped: data.quantityScrapped ?? 0,
        quantityRework: data.quantityRework ?? 0,
        notes: data.notes ?? null,
      },
    });

    return toDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<ProductionEntry | null> {
    const raw = await prisma.productionEntry.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByJobCardId(
    jobCardId: UniqueEntityID,
  ): Promise<ProductionEntry[]> {
    const records = await prisma.productionEntry.findMany({
      where: { jobCardId: jobCardId.toString() },
      orderBy: { enteredAt: 'desc' },
    });

    return records.map(toDomain);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionEntry.delete({
      where: { id: id.toString() },
    });
  }
}
