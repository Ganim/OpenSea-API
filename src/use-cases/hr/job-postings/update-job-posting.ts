import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { JobPosting } from '@/entities/hr/job-posting';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

export interface UpdateJobPostingRequest {
  tenantId: string;
  jobPostingId: string;
  title?: string;
  description?: string;
  departmentId?: string;
  positionId?: string;
  type?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements?: unknown;
  benefits?: string;
  maxApplicants?: number;
}

export interface UpdateJobPostingResponse {
  jobPosting: JobPosting;
}

export class UpdateJobPostingUseCase {
  constructor(private jobPostingsRepository: JobPostingsRepository) {}

  async execute(
    request: UpdateJobPostingRequest,
  ): Promise<UpdateJobPostingResponse> {
    const { tenantId, jobPostingId, title, ...updateData } = request;

    const existingPosting = await this.jobPostingsRepository.findById(
      new UniqueEntityID(jobPostingId),
      tenantId,
    );

    if (!existingPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    if (title !== undefined && title.trim().length === 0) {
      throw new BadRequestError('O título da vaga é obrigatório');
    }

    const updatedPosting = await this.jobPostingsRepository.update({
      id: new UniqueEntityID(jobPostingId),
      title: title?.trim(),
      ...updateData,
    });

    if (!updatedPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    return { jobPosting: updatedPosting };
  }
}
