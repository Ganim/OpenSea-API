import type {
  DealPrediction,
  PredictionFactor,
} from '@/entities/sales/deal-prediction';

export interface DealPredictionDTO {
  id: string;
  dealId: string;
  probability: number;
  estimatedCloseDate?: Date;
  confidence: string;
  factors: PredictionFactor[];
  modelVersion: string;
  createdAt: Date;
}

export function dealPredictionToDTO(
  prediction: DealPrediction,
): DealPredictionDTO {
  const dto: DealPredictionDTO = {
    id: prediction.id.toString(),
    dealId: prediction.dealId.toString(),
    probability: prediction.probability,
    confidence: prediction.confidence,
    factors: prediction.factors,
    modelVersion: prediction.modelVersion,
    createdAt: prediction.createdAt,
  };

  if (prediction.estimatedCloseDate)
    dto.estimatedCloseDate = prediction.estimatedCloseDate;

  return dto;
}
