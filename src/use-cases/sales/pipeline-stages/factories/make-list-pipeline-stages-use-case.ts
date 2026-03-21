import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { ListPipelineStagesUseCase } from '../list-pipeline-stages';

export function makeListPipelineStagesUseCase() {
  const pipelineStagesRepository = new PrismaPipelineStagesRepository();
  return new ListPipelineStagesUseCase(pipelineStagesRepository);
}
