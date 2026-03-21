import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { CreatePipelineStageUseCase } from '../create-pipeline-stage';

export function makeCreatePipelineStageUseCase() {
  const pipelineStagesRepository = new InMemoryPipelineStagesRepository();
  const pipelinesRepository = new InMemoryPipelinesRepository();
  return new CreatePipelineStageUseCase(pipelineStagesRepository, pipelinesRepository);
}
