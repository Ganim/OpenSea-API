import { InMemoryPipelineStagesRepository } from '@/repositories/sales/in-memory/in-memory-pipeline-stages-repository';
import { ListPipelineStagesUseCase } from '../list-pipeline-stages';

export function makeListPipelineStagesUseCase() {
  const pipelineStagesRepository = new InMemoryPipelineStagesRepository();
  return new ListPipelineStagesUseCase(pipelineStagesRepository);
}
