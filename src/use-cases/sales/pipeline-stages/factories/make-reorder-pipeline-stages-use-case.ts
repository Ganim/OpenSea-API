import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { ReorderPipelineStagesUseCase } from '../reorder-pipeline-stages';

export function makeReorderPipelineStagesUseCase() {
  const pipelineStagesRepository = new PrismaPipelineStagesRepository();
  return new ReorderPipelineStagesUseCase(pipelineStagesRepository);
}
