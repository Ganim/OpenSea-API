import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { DeletePipelineStageUseCase } from '../delete-pipeline-stage';

export function makeDeletePipelineStageUseCase() {
  const pipelineStagesRepository = new InMemoryPipelineStagesRepository();
  return new DeletePipelineStageUseCase(pipelineStagesRepository);
}
