import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PipelineStage } from '@/entities/sales/pipeline-stage';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';

export class InMemoryPipelineStagesRepository
  implements PipelineStagesRepository
{
  public items: PipelineStage[] = [];

  async create(stage: PipelineStage): Promise<void> {
    this.items.push(stage);
  }

  async findById(id: UniqueEntityID): Promise<PipelineStage | null> {
    return (
      this.items.find((s) => s.id.toString() === id.toString()) ?? null
    );
  }

  async findManyByPipeline(pipelineId: UniqueEntityID): Promise<PipelineStage[]> {
    return this.items
      .filter((s) => s.pipelineId.toString() === pipelineId.toString())
      .sort((a, b) => a.position - b.position);
  }

  async save(stage: PipelineStage): Promise<void> {
    const index = this.items.findIndex(
      (s) => s.id.toString() === stage.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = stage;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex(
      (s) => s.id.toString() === id.toString(),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async reorder(pipelineId: UniqueEntityID, stageIds: string[]): Promise<void> {
    for (let i = 0; i < stageIds.length; i++) {
      const stage = this.items.find(
        (s) =>
          s.id.toString() === stageIds[i] &&
          s.pipelineId.toString() === pipelineId.toString(),
      );
      if (stage) {
        stage.position = i;
      }
    }
  }
}
