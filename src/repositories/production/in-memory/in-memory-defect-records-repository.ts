import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ProductionDefectRecord } from '@/entities/production/defect-record';
import type {
  CreateDefectRecordSchema,
  DefectRecordsRepository,
} from '../defect-records-repository';

export class InMemoryDefectRecordsRepository
  implements DefectRecordsRepository
{
  public items: ProductionDefectRecord[] = [];

  async create(
    data: CreateDefectRecordSchema,
  ): Promise<ProductionDefectRecord> {
    const defectRecord = ProductionDefectRecord.create({
      inspectionResultId: data.inspectionResultId
        ? new EntityID(data.inspectionResultId)
        : null,
      defectTypeId: new EntityID(data.defectTypeId),
      operatorId: data.operatorId ? new EntityID(data.operatorId) : null,
      quantity: data.quantity ?? 1,
      severity: data.severity,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
    });

    this.items.push(defectRecord);
    return defectRecord;
  }

  async findById(id: UniqueEntityID): Promise<ProductionDefectRecord | null> {
    const item = this.items.find(
      (i) => i.defectRecordId.toString() === id.toString(),
    );
    return item ?? null;
  }

  async findManyByInspectionResultId(
    inspectionResultId: string,
  ): Promise<ProductionDefectRecord[]> {
    return this.items.filter(
      (i) =>
        i.inspectionResultId !== null &&
        i.inspectionResultId.toString() === inspectionResultId,
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex(
      (i) => i.defectRecordId.toString() === id.toString(),
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
