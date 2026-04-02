import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { JobPosting } from '@/entities/hr/job-posting';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

export interface DeleteJobPostingRequest {
  tenantId: string;
  jobPostingId: string;
}

export interface DeleteJobPostingResponse {
  jobPosting: JobPosting;
}

export class DeleteJobPostingUseCase {
  constructor(private jobPostingsRepository: JobPostingsRepository) {}

  async execute(
    request: DeleteJobPostingRequest,
  ): Promise<DeleteJobPostingResponse> {
    const { tenantId, jobPostingId } = request;

    const jobPosting = await this.jobPostingsRepository.findById(
      new UniqueEntityID(jobPostingId),
      tenantId,
    );

    if (!jobPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    jobPosting.softDelete();

    await this.jobPostingsRepository.delete(new UniqueEntityID(jobPostingId));

    return { jobPosting };
  }
}
