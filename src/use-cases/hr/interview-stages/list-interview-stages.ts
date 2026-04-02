import type { InterviewStage } from '@/entities/hr/interview-stage';
import type { InterviewStagesRepository } from '@/repositories/hr/interview-stages-repository';

export interface ListInterviewStagesRequest {
  tenantId: string;
  jobPostingId: string;
}

export interface ListInterviewStagesResponse {
  interviewStages: InterviewStage[];
}

export class ListInterviewStagesUseCase {
  constructor(private interviewStagesRepository: InterviewStagesRepository) {}

  async execute(
    request: ListInterviewStagesRequest,
  ): Promise<ListInterviewStagesResponse> {
    const { tenantId, jobPostingId } = request;

    const interviewStages =
      await this.interviewStagesRepository.findManyByJobPosting(
        jobPostingId,
        tenantId,
      );

    return { interviewStages };
  }
}
