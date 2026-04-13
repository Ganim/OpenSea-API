import type { ProductionInspectionResult } from '@/entities/production/inspection-result';
import { InspectionResultsRepository } from '@/repositories/production/inspection-results-repository';

interface ListInspectionResultsUseCaseRequest {
  productionOrderId: string;
}

interface ListInspectionResultsUseCaseResponse {
  inspectionResults: ProductionInspectionResult[];
}

export class ListInspectionResultsUseCase {
  constructor(
    private inspectionResultsRepository: InspectionResultsRepository,
  ) {}

  async execute({
    productionOrderId,
  }: ListInspectionResultsUseCaseRequest): Promise<ListInspectionResultsUseCaseResponse> {
    const inspectionResults =
      await this.inspectionResultsRepository.findManyByOrderId(
        productionOrderId,
      );

    return { inspectionResults };
  }
}
