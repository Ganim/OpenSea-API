import type { ProductionDefectRecord } from '@/entities/production/defect-record';
import { DefectRecordsRepository } from '@/repositories/production/defect-records-repository';

interface ListDefectRecordsUseCaseRequest {
  inspectionResultId: string;
}

interface ListDefectRecordsUseCaseResponse {
  defectRecords: ProductionDefectRecord[];
}

export class ListDefectRecordsUseCase {
  constructor(private defectRecordsRepository: DefectRecordsRepository) {}

  async execute({
    inspectionResultId,
  }: ListDefectRecordsUseCaseRequest): Promise<ListDefectRecordsUseCaseResponse> {
    const defectRecords =
      await this.defectRecordsRepository.findManyByInspectionResultId(
        inspectionResultId,
      );

    return { defectRecords };
  }
}
