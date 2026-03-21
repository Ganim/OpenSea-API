import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PipelineStage } from '@/entities/sales/pipeline-stage';
import type { PipelineStagesRepository } from '../pipeline-stages-repository';

export class InMemoryPipelineStagesRepository
  implements PipelineStagesRepository
{
  public items: PipelineStage[] = [];

  async create(stage: PipelineStage): Promise<void> {
    this.items.push(stage);
  }

  async findById(id: UniqueEntityID): Promise<PipelineStage | null> {
    const stage = this.items.find((item) => item.id.equals(id));
    return stage ?? null;
  }

  async findManyByPipeline(
    pipelineId: UniqueEntityID,
  ): Promise<PipelineStage[]> {
    return this.items
      .filter((item) => item.pipelineId.equals(pipelineId))
      .sort((a, b) => a.position - b.position);
  }

  async save(stage: PipelineStage): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(stage.id));
    if (index >= 0) {
      this.items[index] = stage;
    } else {
      this.items.push(stage);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  async reorder(
    pipelineId: UniqueEntityID,
    stageIds: string[],
  ): Promise<void> {
    for (let i = 0; i < stageIds.length; i++) {
      const stage = this.items.find(
        (item) =>
          item.id.toString() === stageIds[i] &&
          item.pipelineId.equals(pipelineId),
      );
      if (stage) {
        stage.position = i;
      }
    }
  }
}
