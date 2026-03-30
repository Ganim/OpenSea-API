import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InterviewStage } from '@/entities/hr/interview-stage';
import type { InterviewStagesRepository } from '@/repositories/hr/interview-stages-repository';
import type { JobPostingsRepository } from '@/repositories/hr/job-postings-repository';

const VALID_TYPES = [
  'SCREENING',
  'TECHNICAL',
  'BEHAVIORAL',
  'CULTURE_FIT',
  'FINAL',
] as const;

export interface CreateInterviewStageRequest {
  tenantId: string;
  jobPostingId: string;
  name: string;
  type?: string;
  description?: string;
}

export interface CreateInterviewStageResponse {
  interviewStage: InterviewStage;
}

export class CreateInterviewStageUseCase {
  constructor(
    private interviewStagesRepository: InterviewStagesRepository,
    private jobPostingsRepository: JobPostingsRepository,
  ) {}

  async execute(
    request: CreateInterviewStageRequest,
  ): Promise<CreateInterviewStageResponse> {
    const { tenantId, jobPostingId, name, type, description } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('O nome da etapa é obrigatório');
    }

    if (type && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      throw new BadRequestError(
        `Tipo de etapa inválido. Tipos válidos: ${VALID_TYPES.join(', ')}`,
      );
    }

    const jobPosting = await this.jobPostingsRepository.findById(
      new UniqueEntityID(jobPostingId),
      tenantId,
    );

    if (!jobPosting) {
      throw new ResourceNotFoundError('Vaga não encontrada');
    }

    const maxOrder = await this.interviewStagesRepository.getMaxOrder(
      jobPostingId,
      tenantId,
    );

    const interviewStage = await this.interviewStagesRepository.create({
      tenantId,
      jobPostingId,
      name: name.trim(),
      order: maxOrder + 1,
      type,
      description: description?.trim(),
    });

    return { interviewStage };
  }
}
