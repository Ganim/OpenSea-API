import { QualityHoldsRepository } from '@/repositories/production/quality-holds-repository';

interface CreateQualityHoldUseCaseRequest {
  productionOrderId: string;
  reason: string;
  holdById: string;
}

interface CreateQualityHoldUseCaseResponse {
  qualityHold: import('@/entities/production/quality-hold').ProductionQualityHold;
}

export class CreateQualityHoldUseCase {
  constructor(private qualityHoldsRepository: QualityHoldsRepository) {}

  async execute({
    productionOrderId,
    reason,
    holdById,
  }: CreateQualityHoldUseCaseRequest): Promise<CreateQualityHoldUseCaseResponse> {
    const qualityHold = await this.qualityHoldsRepository.create({
      productionOrderId,
      reason,
      holdById,
    });

    return { qualityHold };
  }
}
