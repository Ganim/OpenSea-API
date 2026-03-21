import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { GetPipelineByIdUseCase } from '../get-pipeline-by-id';

export function makeGetPipelineByIdUseCase() {
  const pipelinesRepository = new PrismaPipelinesRepository();
  return new GetPipelineByIdUseCase(pipelinesRepository);
}
