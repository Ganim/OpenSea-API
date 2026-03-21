import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { CreatePipelineStageUseCase } from '../create-pipeline-stage';

export function makeCreatePipelineStageUseCase() {
  const pipelineStagesRepository = new PrismaPipelineStagesRepository();
  const pipelinesRepository = new PrismaPipelinesRepository();
  return new CreatePipelineStageUseCase(pipelineStagesRepository, pipelinesRepository);
}
