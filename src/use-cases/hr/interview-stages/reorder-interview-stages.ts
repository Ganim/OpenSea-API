import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InterviewStagesRepository } from '@/repositories/hr/interview-stages-repository';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

export interface ReorderInterviewStagesRequest {
  tenantId: string;
  jobPostingId: string;
  stageIds: string[];
}

export interface ReorderInterviewStagesResponse {
  success: boolean;
}

export class ReorderInterviewStagesUseCase {
  constructor(
    private interviewStagesRepository: InterviewStagesRepository,
    private jobPostingsRepository: JobPostingsRepository,
  ) {}

  async execute(
    request: ReorderInterviewStagesRequest,
  ): Promise<ReorderInterviewStagesResponse> {
    const { tenantId, jobPostingId, stageIds } = request;

    const jobPosting = await this.jobPostingsRepository.findById(
      new UniqueEntityID(jobPostingId),
      tenantId,
    );

    if (!jobPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    const stages =
      await this.interviewStagesRepository.findManyByJobPosting(
        jobPostingId,
        tenantId,
      );

    const existingIds = new Set(stages.map((stage) => stage.id.toString()));
    for (const stageId of stageIds) {
      if (!existingIds.has(stageId)) {
        throw new ResourceNotFoundError(
          `Etapa ${stageId} não encontrada nesta vaga`,
        );
      }
    }

    const orderUpdates = stageIds.map((stageId, index) => ({
      id: new UniqueEntityID(stageId),
      order: index + 1,
    }));

    await this.interviewStagesRepository.updateOrder(orderUpdates);

    return { success: true };
  }
}
