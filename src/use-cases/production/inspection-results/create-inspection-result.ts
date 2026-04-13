import { InspectionResultsRepository } from '@/repositories/production/inspection-results-repository';

interface CreateInspectionResultUseCaseRequest {
  inspectionPlanId: string;
  productionOrderId: string;
  inspectedById: string;
  sampleSize: number;
  defectsFound?: number;
  notes?: string;
}

interface CreateInspectionResultUseCaseResponse {
  inspectionResult: import('@/entities/production/inspection-result').ProductionInspectionResult;
}

export class CreateInspectionResultUseCase {
  constructor(
    private inspectionResultsRepository: InspectionResultsRepository,
  ) {}

  async execute({
    inspectionPlanId,
    productionOrderId,
    inspectedById,
    sampleSize,
    defectsFound,
    notes,
  }: CreateInspectionResultUseCaseRequest): Promise<CreateInspectionResultUseCaseResponse> {
    const inspectionResult = await this.inspectionResultsRepository.create({
      inspectionPlanId,
      productionOrderId,
      inspectedById,
      sampleSize,
      defectsFound,
      notes,
    });

    return { inspectionResult };
  }
}
