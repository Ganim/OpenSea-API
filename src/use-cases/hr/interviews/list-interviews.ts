import type { Interview } from '@/entities/hr/interview';
import type { InterviewsRepository } from '@/repositories/hr/interviews-repository';

export interface ListInterviewsRequest {
  tenantId: string;
  applicationId?: string;
  interviewerId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListInterviewsResponse {
  interviews: Interview[];
  total: number;
}

export class ListInterviewsUseCase {
  constructor(private interviewsRepository: InterviewsRepository) {}

  async execute(
    request: ListInterviewsRequest,
  ): Promise<ListInterviewsResponse> {
    const { tenantId, ...filters } = request;

    const { interviews, total } = await this.interviewsRepository.findMany(
      tenantId,
      filters,
    );

    return { interviews, total };
  }
}
