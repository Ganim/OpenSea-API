import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { UpdatePipelineStageUseCase } from '../update-pipeline-stage';

export function makeUpdatePipelineStageUseCase() {
  const pipelineStagesRepository = new InMemoryPipelineStagesRepository();
  const pipelinesRepository = new InMemoryPipelinesRepository();
  return new UpdatePipelineStageUseCase(pipelineStagesRepository, pipelinesRepository);
}
