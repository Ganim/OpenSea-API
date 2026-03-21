import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { UpdatePipelineStageUseCase } from '../update-pipeline-stage';

export function makeUpdatePipelineStageUseCase() {
  const pipelineStagesRepository = new PrismaPipelineStagesRepository();
  const pipelinesRepository = new PrismaPipelinesRepository();
  return new UpdatePipelineStageUseCase(pipelineStagesRepository, pipelinesRepository);
}
