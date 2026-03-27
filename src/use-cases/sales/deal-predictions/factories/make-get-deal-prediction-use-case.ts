import { PrismaDealPredictionsRepository } from '@/repositories/sales/prisma/prisma-deal-predictions-repository';
import { GetDealPredictionUseCase } from '../get-deal-prediction';

export function makeGetDealPredictionUseCase() {
  const dealPredictionsRepository = new PrismaDealPredictionsRepository();
  return new GetDealPredictionUseCase(dealPredictionsRepository);
}
