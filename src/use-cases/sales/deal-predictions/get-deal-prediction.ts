import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DealPredictionDTO } from '@/mappers/sales/deal-prediction/deal-prediction-to-dto';
import { dealPredictionToDTO } from '@/mappers/sales/deal-prediction/deal-prediction-to-dto';
import type { DealPredictionsRepository } from '@/repositories/sales/deal-predictions-repository';

interface GetDealPredictionUseCaseRequest {
  tenantId: string;
  dealId: string;
}

interface GetDealPredictionUseCaseResponse {
  prediction: DealPredictionDTO | null;
}

export class GetDealPredictionUseCase {
  constructor(private dealPredictionsRepository: DealPredictionsRepository) {}

  async execute(
    input: GetDealPredictionUseCaseRequest,
  ): Promise<GetDealPredictionUseCaseResponse> {
    const prediction = await this.dealPredictionsRepository.findLatestByDealId(
      new UniqueEntityID(input.dealId),
      input.tenantId,
    );

    return {
      prediction: prediction ? dealPredictionToDTO(prediction) : null,
    };
  }
}
