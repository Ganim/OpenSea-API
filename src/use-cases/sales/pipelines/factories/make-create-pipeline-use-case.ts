import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { CreatePipelineUseCase } from '../create-pipeline';

export function makeCreatePipelineUseCase() {
  const pipelinesRepository = new InMemoryPipelinesRepository();
  return new CreatePipelineUseCase(pipelinesRepository);
}
