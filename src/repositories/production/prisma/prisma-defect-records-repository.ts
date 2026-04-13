import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { DefectSeverity } from '@/entities/production/defect-record';
import { ProductionDefectRecord } from '@/entities/production/defect-record';
import { prisma } from '@/lib/prisma';
import type {
  DefectRecordsRepository,
  CreateDefectRecordSchema,
} from '../defect-records-repository';

function toDomain(raw: {
  id: string;
  inspectionResultId: string | null;
  defectTypeId: string;
  operatorId: string | null;
  quantity: number;
  severity: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
}): ProductionDefectRecord {
  return ProductionDefectRecord.create(
    {
      inspectionResultId: raw.inspectionResultId
        ? new EntityID(raw.inspectionResultId)
        : null,
      defectTypeId: new EntityID(raw.defectTypeId),
      operatorId: raw.operatorId ? new EntityID(raw.operatorId) : null,
      quantity: raw.quantity,
      severity: raw.severity as DefectSeverity,
      description: raw.description ?? null,
      imageUrl: raw.imageUrl ?? null,
      createdAt: raw.createdAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaDefectRecordsRepository implements DefectRecordsRepository {
  async create(
    data: CreateDefectRecordSchema,
  ): Promise<ProductionDefectRecord> {
    const raw = await prisma.productionDefectRecord.create({
      data: {
        inspectionResultId: data.inspectionResultId ?? null,
        defectTypeId: data.defectTypeId,
        operatorId: data.operatorId ?? null,
        quantity: data.quantity ?? 1,
        severity: data.severity,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
      },
    });

    return toDomain(raw);
  }

  async findById(id: UniqueEntityID): Promise<ProductionDefectRecord | null> {
    const raw = await prisma.productionDefectRecord.findUnique({
      where: { id: id.toString() },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findManyByInspectionResultId(
    inspectionResultId: string,
  ): Promise<ProductionDefectRecord[]> {
    const records = await prisma.productionDefectRecord.findMany({
      where: { inspectionResultId },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(toDomain);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionDefectRecord.delete({
      where: { id: id.toString() },
    });
  }
}
