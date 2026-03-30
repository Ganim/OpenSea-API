import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InterviewStage } from '@/entities/hr/interview-stage';
import type {
  CreateInterviewStageSchema,
  InterviewStagesRepository,
  UpdateInterviewStageOrderSchema,
} from '../interview-stages-repository';

export class InMemoryInterviewStagesRepository
  implements InterviewStagesRepository
{
  public items: InterviewStage[] = [];

  async create(data: CreateInterviewStageSchema): Promise<InterviewStage> {
    const stage = InterviewStage.create({
      tenantId: new UniqueEntityID(data.tenantId),
      jobPostingId: new UniqueEntityID(data.jobPostingId),
      name: data.name,
      order: data.order,
      type: data.type ?? 'SCREENING',
      description: data.description,
    });

    this.items.push(stage);
    return stage;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<InterviewStage | null> {
    return (
      this.items.find(
        (stage) =>
          stage.id.equals(id) &&
          stage.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyByJobPosting(
    jobPostingId: string,
    tenantId: string,
  ): Promise<InterviewStage[]> {
    return this.items
      .filter(
        (stage) =>
          stage.jobPostingId.toString() === jobPostingId &&
          stage.tenantId.toString() === tenantId,
      )
      .sort((a, b) => a.order - b.order);
  }

  async updateOrder(
    stages: UpdateInterviewStageOrderSchema[],
  ): Promise<void> {
    for (const stageUpdate of stages) {
      const index = this.items.findIndex((stage) =>
        stage.id.equals(stageUpdate.id),
      );
      if (index >= 0) {
        this.items[index].updateOrder(stageUpdate.order);
      }
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((stage) => stage.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  async getMaxOrder(
    jobPostingId: string,
    tenantId: string,
  ): Promise<number> {
    const stages = this.items.filter(
      (stage) =>
        stage.jobPostingId.toString() === jobPostingId &&
        stage.tenantId.toString() === tenantId,
    );

    if (stages.length === 0) return 0;
    return Math.max(...stages.map((stage) => stage.order));
  }
}
