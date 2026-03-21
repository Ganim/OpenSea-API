import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { DeletePipelineStageUseCase } from '../delete-pipeline-stage';

export function makeDeletePipelineStageUseCase() {
  const pipelineStagesRepository = new PrismaPipelineStagesRepository();
  return new DeletePipelineStageUseCase(pipelineStagesRepository);
}
