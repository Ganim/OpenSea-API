import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { JobPosting } from '@/entities/hr/job-posting';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

export interface GetJobPostingRequest {
  tenantId: string;
  jobPostingId: string;
}

export interface GetJobPostingResponse {
  jobPosting: JobPosting;
}

export class GetJobPostingUseCase {
  constructor(private jobPostingsRepository: JobPostingsRepository) {}

  async execute(
    request: GetJobPostingRequest,
  ): Promise<GetJobPostingResponse> {
    const { tenantId, jobPostingId } = request;

    const jobPosting = await this.jobPostingsRepository.findById(
      new UniqueEntityID(jobPostingId),
      tenantId,
    );

    if (!jobPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    return { jobPosting };
  }
}
