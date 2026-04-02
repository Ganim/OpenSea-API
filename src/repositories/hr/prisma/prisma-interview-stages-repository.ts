import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InterviewStage } from '@/entities/hr/interview-stage';
import { prisma } from '@/lib/prisma';
import { mapInterviewStagePrismaToDomain } from '@/mappers/hr/interview-stage';
import type {
  CreateInterviewStageSchema,
  InterviewStagesRepository,
  UpdateInterviewStageOrderSchema,
} from '../interview-stages-repository';

export class PrismaInterviewStagesRepository
  implements InterviewStagesRepository
{
  async create(data: CreateInterviewStageSchema): Promise<InterviewStage> {
    const stageData = await prisma.interviewStage.create({
      data: {
        tenantId: data.tenantId,
        jobPostingId: data.jobPostingId,
        name: data.name,
        order: data.order,
        type: (data.type as 'SCREENING') ?? 'SCREENING',
        description: data.description,
      },
    });

    return InterviewStage.create(
      mapInterviewStagePrismaToDomain(stageData),
      new UniqueEntityID(stageData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<InterviewStage | null> {
    const stageData = await prisma.interviewStage.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!stageData) return null;

    return InterviewStage.create(
      mapInterviewStagePrismaToDomain(stageData),
      new UniqueEntityID(stageData.id),
    );
  }

  async findManyByJobPosting(
    jobPostingId: string,
    tenantId: string,
  ): Promise<InterviewStage[]> {
    const stagesData = await prisma.interviewStage.findMany({
      where: { jobPostingId, tenantId },
      orderBy: { order: 'asc' },
    });

    return stagesData.map((stage) =>
      InterviewStage.create(
        mapInterviewStagePrismaToDomain(stage),
        new UniqueEntityID(stage.id),
      ),
    );
  }

  async updateOrder(stages: UpdateInterviewStageOrderSchema[]): Promise<void> {
    await prisma.$transaction(
      stages.map((stage) =>
        prisma.interviewStage.update({
          where: { id: stage.id.toString() },
          data: { order: stage.order },
        }),
      ),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.interviewStage.delete({
      where: { id: id.toString() },
    });
  }

  async getMaxOrder(jobPostingId: string, tenantId: string): Promise<number> {
    const result = await prisma.interviewStage.aggregate({
      where: { jobPostingId, tenantId },
      _max: { order: true },
    });

    return result._max.order ?? 0;
  }
}
