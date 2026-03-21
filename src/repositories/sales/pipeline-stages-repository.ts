import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PipelineStage } from '@/entities/sales/pipeline-stage';

export interface PipelineStagesRepository {
  create(stage: PipelineStage): Promise<void>;
  findById(id: UniqueEntityID): Promise<PipelineStage | null>;
  findManyByPipeline(pipelineId: UniqueEntityID): Promise<PipelineStage[]>;
  save(stage: PipelineStage): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  reorder(pipelineId: UniqueEntityID, stageIds: string[]): Promise<void>;
}
