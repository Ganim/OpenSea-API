import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { GetPipelineByIdUseCase } from '../get-pipeline-by-id';

export function makeGetPipelineByIdUseCase() {
  const pipelinesRepository = new InMemoryPipelinesRepository();
  return new GetPipelineByIdUseCase(pipelinesRepository);
}
