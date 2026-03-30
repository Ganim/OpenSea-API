import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { JobPosting } from '@/entities/hr/job-posting';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

const VALID_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERN', 'TEMPORARY'] as const;

export interface CreateJobPostingRequest {
  tenantId: string;
  title: string;
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

export interface CreateJobPostingResponse {
  jobPosting: JobPosting;
}

export class CreateJobPostingUseCase {
  constructor(private jobPostingsRepository: JobPostingsRepository) {}

  async execute(
    request: CreateJobPostingRequest,
  ): Promise<CreateJobPostingResponse> {
    const { tenantId, title, type, salaryMin, salaryMax, ...restData } =
      request;

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('O título da vaga é obrigatório');
    }

    if (type && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      throw new BadRequestError(
        `Tipo de vaga inválido. Tipos válidos: ${VALID_TYPES.join(', ')}`,
      );
    }

    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin > salaryMax
    ) {
      throw new BadRequestError(
        'O salário mínimo não pode ser maior que o salário máximo',
      );
    }

    const jobPosting = await this.jobPostingsRepository.create({
      tenantId,
      title: title.trim(),
      type,
      salaryMin,
      salaryMax,
      ...restData,
    });

    return { jobPosting };
  }
}
