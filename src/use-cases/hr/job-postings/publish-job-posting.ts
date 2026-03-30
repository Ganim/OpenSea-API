import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { JobPosting } from '@/entities/hr/job-posting';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

export interface PublishJobPostingRequest {
  tenantId: string;
  jobPostingId: string;
}

export interface PublishJobPostingResponse {
  jobPosting: JobPosting;
}

export class PublishJobPostingUseCase {
  constructor(private jobPostingsRepository: JobPostingsRepository) {}

  async execute(
    request: PublishJobPostingRequest,
  ): Promise<PublishJobPostingResponse> {
    const { tenantId, jobPostingId } = request;

    const jobPosting = await this.jobPostingsRepository.findById(
      new UniqueEntityID(jobPostingId),
      tenantId,
    );

    if (!jobPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    if (jobPosting.status !== 'DRAFT') {
      throw new BadRequestError(
        'Apenas vagas em rascunho podem ser publicadas',
      );
    }

    const updatedPosting = await this.jobPostingsRepository.update({
      id: new UniqueEntityID(jobPostingId),
      status: 'OPEN',
      publishedAt: new Date(),
    });

    if (!updatedPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    return { jobPosting: updatedPosting };
  }
}
