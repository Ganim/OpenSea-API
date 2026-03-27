import { PrismaDealPredictionsRepository } from '@/repositories/sales/prisma/prisma-deal-predictions-repository';
import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { PredictDealClosureUseCase } from '../predict-deal-closure';

export function makePredictDealClosureUseCase() {
  const dealsRepository = new PrismaDealsRepository();
  const dealPredictionsRepository = new PrismaDealPredictionsRepository();
  const pipelineStagesRepository = new PrismaPipelineStagesRepository();

  return new PredictDealClosureUseCase(
    dealsRepository,
    dealPredictionsRepository,
    pipelineStagesRepository,
  );
}
