import { PrismaDealPredictionsRepository } from '@/repositories/sales/prisma/prisma-deal-predictions-repository';
import { PrismaDealsRepository } from '@/repositories/sales/prisma/prisma-deals-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { BatchPredictUseCase } from '../batch-predict';

export function makeBatchPredictUseCase() {
  const dealsRepository = new PrismaDealsRepository();
  const dealPredictionsRepository = new PrismaDealPredictionsRepository();
  const pipelineStagesRepository = new PrismaPipelineStagesRepository();

  return new BatchPredictUseCase(
    dealsRepository,
    dealPredictionsRepository,
    pipelineStagesRepository,
  );
}
