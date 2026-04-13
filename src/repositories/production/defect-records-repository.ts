import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DefectSeverity } from '@/entities/production/defect-record';
import { ProductionDefectRecord } from '@/entities/production/defect-record';

export interface CreateDefectRecordSchema {
  inspectionResultId?: string;
  defectTypeId: string;
  operatorId?: string;
  quantity?: number;
  severity: DefectSeverity;
  description?: string;
  imageUrl?: string;
}

export interface DefectRecordsRepository {
  create(data: CreateDefectRecordSchema): Promise<ProductionDefectRecord>;
  findById(id: UniqueEntityID): Promise<ProductionDefectRecord | null>;
  findManyByInspectionResultId(
    inspectionResultId: string,
  ): Promise<ProductionDefectRecord[]>;
  delete(id: UniqueEntityID): Promise<void>;
}
