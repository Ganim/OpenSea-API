import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Interview } from '@/entities/hr/interview';
import type { InterviewsRepository } from '@/repositories/hr/interviews-repository';

export interface CancelInterviewRequest {
  tenantId: string;
  interviewId: string;
}

export interface CancelInterviewResponse {
  interview: Interview;
}

export class CancelInterviewUseCase {
  constructor(private interviewsRepository: InterviewsRepository) {}

  async execute(
    request: CancelInterviewRequest,
  ): Promise<CancelInterviewResponse> {
    const { tenantId, interviewId } = request;

    const interview = await this.interviewsRepository.findById(
      new UniqueEntityID(interviewId),
      tenantId,
    );

    if (!interview) {
      throw new ResourceNotFoundError('Entrevista não encontrada');
    }

    if (interview.status !== 'SCHEDULED') {
      throw new BadRequestError(
        'Apenas entrevistas agendadas podem ser canceladas',
      );
    }

    const updatedInterview = await this.interviewsRepository.update({
      id: new UniqueEntityID(interviewId),
      status: 'CANCELLED',
    });

    if (!updatedInterview) {
      throw new ResourceNotFoundError('Entrevista não encontrada');
    }

    return { interview: updatedInterview };
  }
}
