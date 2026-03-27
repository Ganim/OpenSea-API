import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { DealPrediction } from '@/entities/sales/deal-prediction';
import type { PredictionFactor } from '@/entities/sales/deal-prediction';
import type { DealPredictionDTO } from '@/mappers/sales/deal-prediction/deal-prediction-to-dto';
import { dealPredictionToDTO } from '@/mappers/sales/deal-prediction/deal-prediction-to-dto';
import type { DealPredictionsRepository } from '@/repositories/sales/deal-predictions-repository';
import type { DealsRepository } from '@/repositories/sales/deals-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';

interface PredictDealClosureUseCaseRequest {
  tenantId: string;
  dealId: string;
}

interface PredictDealClosureUseCaseResponse {
  prediction: DealPredictionDTO;
}

const AVERAGE_DAYS_PER_STAGE = 14;
const AVERAGE_DEAL_VALUE = 5000;

export class PredictDealClosureUseCase {
  constructor(
    private dealsRepository: DealsRepository,
    private dealPredictionsRepository: DealPredictionsRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
  ) {}

  async execute(
    input: PredictDealClosureUseCaseRequest,
  ): Promise<PredictDealClosureUseCaseResponse> {
    const deal = await this.dealsRepository.findById(
      new UniqueEntityID(input.dealId),
      input.tenantId,
    );

    if (!deal) {
      throw new ResourceNotFoundError('Deal not found.');
    }

    const stages = await this.pipelineStagesRepository.findManyByPipeline(
      deal.pipelineId,
    );

    const factors: PredictionFactor[] = [];
    let baseProbability = 0.5;

    // Factor 1: Stage progression
    if (stages.length > 0) {
      const currentStageIndex = stages.findIndex(
        (stage) => stage.id.toString() === deal.stageId.toString(),
      );
      if (currentStageIndex >= 0) {
        const stageProgressionRatio = (currentStageIndex + 1) / stages.length;
        const stageBoost = stageProgressionRatio * 0.3;
        baseProbability += stageBoost;
        factors.push({
          factor: 'stage_progression',
          impact: stageBoost,
          description: `Deal is at stage ${currentStageIndex + 1} of ${stages.length} (${Math.round(stageProgressionRatio * 100)}% through pipeline)`,
        });
      }
    }

    // Factor 2: Time in current stage
    if (deal.stageEnteredAt) {
      const daysInStage = Math.floor(
        (Date.now() - deal.stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysInStage > AVERAGE_DAYS_PER_STAGE * 2) {
        const penalty = -0.15;
        baseProbability += penalty;
        factors.push({
          factor: 'stage_duration',
          impact: penalty,
          description: `Deal has been in current stage for ${daysInStage} days (average: ${AVERAGE_DAYS_PER_STAGE})`,
        });
      } else if (daysInStage <= AVERAGE_DAYS_PER_STAGE) {
        const boost = 0.05;
        baseProbability += boost;
        factors.push({
          factor: 'stage_duration',
          impact: boost,
          description: `Deal is progressing at a healthy pace (${daysInStage} days in current stage)`,
        });
      }
    }

    // Factor 3: Deal value vs average
    if (deal.value !== undefined && deal.value > 0) {
      const valueRatio = deal.value / AVERAGE_DEAL_VALUE;
      if (valueRatio > 3) {
        const penalty = -0.1;
        baseProbability += penalty;
        factors.push({
          factor: 'deal_value',
          impact: penalty,
          description: `High-value deal (${valueRatio.toFixed(1)}x average) typically requires more time`,
        });
      } else if (valueRatio < 0.5) {
        const boost = 0.05;
        baseProbability += boost;
        factors.push({
          factor: 'deal_value',
          impact: boost,
          description: `Lower-value deal tends to close faster`,
        });
      }
    }

    // Factor 4: Deal status
    if (deal.status === 'WON') {
      baseProbability = 1.0;
      factors.push({
        factor: 'deal_status',
        impact: 0.5,
        description: 'Deal has already been won',
      });
    } else if (deal.status === 'LOST') {
      baseProbability = 0.0;
      factors.push({
        factor: 'deal_status',
        impact: -0.5,
        description: 'Deal has been lost',
      });
    }

    // Clamp probability
    const probability = Math.max(0, Math.min(1, baseProbability));

    // Estimate close date based on probability and remaining stages
    let estimatedCloseDate: Date | undefined;
    if (probability > 0 && probability < 1 && stages.length > 0) {
      const currentStageIndex = stages.findIndex(
        (stage) => stage.id.toString() === deal.stageId.toString(),
      );
      const remainingStages = stages.length - (currentStageIndex + 1);
      const estimatedDaysRemaining = remainingStages * AVERAGE_DAYS_PER_STAGE;
      estimatedCloseDate = new Date();
      estimatedCloseDate.setDate(
        estimatedCloseDate.getDate() + estimatedDaysRemaining,
      );
    }

    const prediction = DealPrediction.create({
      tenantId: new UniqueEntityID(input.tenantId),
      dealId: new UniqueEntityID(input.dealId),
      probability,
      estimatedCloseDate,
      factors,
    });

    await this.dealPredictionsRepository.create(prediction);

    return {
      prediction: dealPredictionToDTO(prediction),
    };
  }
}
