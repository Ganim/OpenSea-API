import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { CreatePipelineUseCase } from '../create-pipeline';

export function makeCreatePipelineUseCase() {
  const pipelinesRepository = new PrismaPipelinesRepository();
  return new CreatePipelineUseCase(pipelinesRepository);
}
