import type { QualityHoldStatus } from '@/entities/production/quality-hold';
import { QualityHoldsRepository } from '@/repositories/production/quality-holds-repository';

interface ListQualityHoldsUseCaseRequest {
  productionOrderId?: string;
  status?: QualityHoldStatus;
}

interface ListQualityHoldsUseCaseResponse {
  qualityHolds: import('@/entities/production/quality-hold').ProductionQualityHold[];
}

export class ListQualityHoldsUseCase {
  constructor(private qualityHoldsRepository: QualityHoldsRepository) {}

  async execute({
    productionOrderId,
    status,
  }: ListQualityHoldsUseCaseRequest): Promise<ListQualityHoldsUseCaseResponse> {
    const qualityHolds = await this.qualityHoldsRepository.findMany({
      productionOrderId,
      status,
    });

    return { qualityHolds };
  }
}
