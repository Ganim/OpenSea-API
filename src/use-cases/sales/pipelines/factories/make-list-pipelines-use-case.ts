import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { ListPipelinesUseCase } from '../list-pipelines';

export function makeListPipelinesUseCase() {
  const pipelinesRepository = new PrismaPipelinesRepository();
  return new ListPipelinesUseCase(pipelinesRepository);
}
