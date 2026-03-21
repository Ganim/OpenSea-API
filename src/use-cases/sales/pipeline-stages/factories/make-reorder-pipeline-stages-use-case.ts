import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { ReorderPipelineStagesUseCase } from '../reorder-pipeline-stages';

export function makeReorderPipelineStagesUseCase() {
  const pipelineStagesRepository = new InMemoryPipelineStagesRepository();
  return new ReorderPipelineStagesUseCase(pipelineStagesRepository);
}
