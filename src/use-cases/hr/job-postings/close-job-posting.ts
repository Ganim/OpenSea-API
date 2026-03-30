import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { JobPosting } from '@/entities/hr/job-posting';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

export interface CloseJobPostingRequest {
  tenantId: string;
  jobPostingId: string;
}

export interface CloseJobPostingResponse {
  jobPosting: JobPosting;
}

export class CloseJobPostingUseCase {
  constructor(private jobPostingsRepository: JobPostingsRepository) {}

  async execute(
    request: CloseJobPostingRequest,
  ): Promise<CloseJobPostingResponse> {
    const { tenantId, jobPostingId } = request;

    const jobPosting = await this.jobPostingsRepository.findById(
      new UniqueEntityID(jobPostingId),
      tenantId,
    );

    if (!jobPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    if (jobPosting.status !== 'OPEN') {
      throw new BadRequestError('Apenas vagas abertas podem ser encerradas');
    }

    const updatedPosting = await this.jobPostingsRepository.update({
      id: new UniqueEntityID(jobPostingId),
      status: 'CLOSED',
      closedAt: new Date(),
    });

    if (!updatedPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    return { jobPosting: updatedPosting };
  }
}
