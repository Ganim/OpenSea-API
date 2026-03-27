import type { DealPredictionDTO } from '@/mappers/sales/deal-prediction/deal-prediction-to-dto';
import type { DealsRepository } from '@/repositories/sales/deals-repository';
import type { DealPredictionsRepository } from '@/repositories/sales/deal-predictions-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';
import { PredictDealClosureUseCase } from './predict-deal-closure';

interface BatchPredictUseCaseRequest {
  tenantId: string;
}

interface BatchPredictUseCaseResponse {
  predictions: DealPredictionDTO[];
  processedCount: number;
}

export class BatchPredictUseCase {
  private predictDealClosureUseCase: PredictDealClosureUseCase;

  constructor(
    private dealsRepository: DealsRepository,
    private dealPredictionsRepository: DealPredictionsRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
  ) {
    this.predictDealClosureUseCase = new PredictDealClosureUseCase(
      dealsRepository,
      dealPredictionsRepository,
      pipelineStagesRepository,
    );
  }

  async execute(
    input: BatchPredictUseCaseRequest,
  ): Promise<BatchPredictUseCaseResponse> {
    const openDeals = await this.dealsRepository.findManyPaginated({
      tenantId: input.tenantId,
      page: 1,
      limit: 100,
      status: 'OPEN',
    });

    const predictions: DealPredictionDTO[] = [];

    for (const deal of openDeals.data) {
      try {
        const { prediction } = await this.predictDealClosureUseCase.execute({
          tenantId: input.tenantId,
          dealId: deal.id.toString(),
        });
        predictions.push(prediction);
      } catch {
        // Skip deals that fail prediction (e.g., missing pipeline stages)
        continue;
      }
    }

    return {
      predictions,
      processedCount: predictions.length,
    };
  }
}
