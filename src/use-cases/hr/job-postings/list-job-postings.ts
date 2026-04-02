import type { JobPosting } from '@/entities/hr/job-posting';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

export interface ListJobPostingsRequest {
  tenantId: string;
  status?: string;
  type?: string;
  departmentId?: string;
  positionId?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface ListJobPostingsResponse {
  jobPostings: JobPosting[];
  total: number;
}

export class ListJobPostingsUseCase {
  constructor(private jobPostingsRepository: JobPostingsRepository) {}

  async execute(
    request: ListJobPostingsRequest,
  ): Promise<ListJobPostingsResponse> {
    const { tenantId, ...filters } = request;

    const { jobPostings, total } = await this.jobPostingsRepository.findMany(
      tenantId,
      filters,
    );

    return { jobPostings, total };
  }
}
