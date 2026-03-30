import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Interview } from '@/entities/hr/interview';
import type { ApplicationsRepository } from '@/repositories/hr/applications-repository';
import type { InterviewStagesRepository } from '@/repositories/hr/interview-stages-repository';
import type { InterviewsRepository } from '@/repositories/hr/interviews-repository';

export interface ScheduleInterviewRequest {
  tenantId: string;
  applicationId: string;
  interviewStageId: string;
  interviewerId: string;
  scheduledAt: Date;
  duration?: number;
  location?: string;
  meetingUrl?: string;
}

export interface ScheduleInterviewResponse {
  interview: Interview;
}

export class ScheduleInterviewUseCase {
  constructor(
    private interviewsRepository: InterviewsRepository,
    private applicationsRepository: ApplicationsRepository,
    private interviewStagesRepository: InterviewStagesRepository,
  ) {}

  async execute(
    request: ScheduleInterviewRequest,
  ): Promise<ScheduleInterviewResponse> {
    const {
      tenantId,
      applicationId,
      interviewStageId,
      interviewerId,
      scheduledAt,
      duration,
      location,
      meetingUrl,
    } = request;

    const application = await this.applicationsRepository.findById(
      new UniqueEntityID(applicationId),
      tenantId,
    );

    if (!application) {
      throw new ResourceNotFoundError('Candidatura não encontrada');
    }

    if (
      application.status === 'REJECTED' ||
      application.status === 'WITHDRAWN' ||
      application.status === 'HIRED'
    ) {
      throw new BadRequestError(
        'Não é possível agendar entrevista para uma candidatura finalizada',
      );
    }

    const stage = await this.interviewStagesRepository.findById(
      new UniqueEntityID(interviewStageId),
      tenantId,
    );

    if (!stage) {
      throw new ResourceNotFoundError('Etapa de entrevista não encontrada');
    }

    if (scheduledAt < new Date()) {
      throw new BadRequestError(
        'A data da entrevista não pode ser no passado',
      );
    }

    const interview = await this.interviewsRepository.create({
      tenantId,
      applicationId,
      interviewStageId,
      interviewerId,
      scheduledAt,
      duration,
      location,
      meetingUrl,
    });

    return { interview };
  }
}
