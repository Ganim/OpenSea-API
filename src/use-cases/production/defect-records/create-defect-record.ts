import type { DefectSeverity } from '@/entities/production/defect-record';
import { DefectRecordsRepository } from '@/repositories/production/defect-records-repository';

interface CreateDefectRecordUseCaseRequest {
  inspectionResultId?: string;
  defectTypeId: string;
  operatorId?: string;
  quantity?: number;
  severity: DefectSeverity;
  description?: string;
  imageUrl?: string;
}

interface CreateDefectRecordUseCaseResponse {
  defectRecord: import('@/entities/production/defect-record').ProductionDefectRecord;
}

export class CreateDefectRecordUseCase {
  constructor(private defectRecordsRepository: DefectRecordsRepository) {}

  async execute({
    inspectionResultId,
    defectTypeId,
    operatorId,
    quantity,
    severity,
    description,
    imageUrl,
  }: CreateDefectRecordUseCaseRequest): Promise<CreateDefectRecordUseCaseResponse> {
    const defectRecord = await this.defectRecordsRepository.create({
      inspectionResultId,
      defectTypeId,
      operatorId,
      quantity,
      severity,
      description,
      imageUrl,
    });

    return { defectRecord };
  }
}
