import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { DeletePipelineUseCase } from '../delete-pipeline';

export function makeDeletePipelineUseCase() {
  const pipelinesRepository = new PrismaPipelinesRepository();
  return new DeletePipelineUseCase(pipelinesRepository);
}
