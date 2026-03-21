import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { UpdatePipelineUseCase } from '../update-pipeline';

export function makeUpdatePipelineUseCase() {
  const pipelinesRepository = new InMemoryPipelinesRepository();
  return new UpdatePipelineUseCase(pipelinesRepository);
}
