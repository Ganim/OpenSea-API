import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { UpdatePipelineUseCase } from '../update-pipeline';

export function makeUpdatePipelineUseCase() {
  const pipelinesRepository = new PrismaPipelinesRepository();
  return new UpdatePipelineUseCase(pipelinesRepository);
}
