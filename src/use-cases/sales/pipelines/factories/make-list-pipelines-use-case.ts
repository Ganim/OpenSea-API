import { InMemoryPipelinesRepository } from '@/repositories/sales/in-memory/in-memory-pipelines-repository';
import { ListPipelinesUseCase } from '../list-pipelines';

export function makeListPipelinesUseCase() {
  const pipelinesRepository = new InMemoryPipelinesRepository();
  return new ListPipelinesUseCase(pipelinesRepository);
}
