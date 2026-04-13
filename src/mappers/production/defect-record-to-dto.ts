import type { ProductionDefectRecord } from '@/entities/production/defect-record';

export interface DefectRecordDTO {
  id: string;
  inspectionResultId: string | null;
  defectTypeId: string;
  operatorId: string | null;
  quantity: number;
  severity: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

export function defectRecordToDTO(
  entity: ProductionDefectRecord,
): DefectRecordDTO {
  return {
    id: entity.defectRecordId.toString(),
    inspectionResultId: entity.inspectionResultId?.toString() ?? null,
    defectTypeId: entity.defectTypeId.toString(),
    operatorId: entity.operatorId?.toString() ?? null,
    quantity: entity.quantity,
    severity: entity.severity,
    description: entity.description,
    imageUrl: entity.imageUrl,
    createdAt: entity.createdAt,
  };
}
