import { DefectTypesRepository } from '@/repositories/production/defect-types-repository';

interface ListDefectTypesUseCaseRequest {
  tenantId: string;
}

interface ListDefectTypesUseCaseResponse {
  defectTypes: import('@/entities/production/defect-type').ProductionDefectType[];
}

export class ListDefectTypesUseCase {
  constructor(private defectTypesRepository: DefectTypesRepository) {}

  async execute({
    tenantId,
  }: ListDefectTypesUseCaseRequest): Promise<ListDefectTypesUseCaseResponse> {
    const defectTypes = await this.defectTypesRepository.findMany(tenantId);

    return { defectTypes };
  }
}
