import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { DeletePipelineUseCase } from '../delete-pipeline';

export function makeDeletePipelineUseCase() {
  const pipelinesRepository = new InMemoryPipelinesRepository();
  return new DeletePipelineUseCase(pipelinesRepository);
}
