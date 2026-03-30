import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Interview } from '@/entities/hr/interview';
import type { InterviewsRepository } from '@/repositories/hr/interviews-repository';

const VALID_RECOMMENDATIONS = ['ADVANCE', 'HOLD', 'REJECT'] as const;

export interface CompleteInterviewRequest {
  tenantId: string;
  interviewId: string;
  feedback: string;
  rating: number;
  recommendation: string;
}

export interface CompleteInterviewResponse {
  interview: Interview;
}

export class CompleteInterviewUseCase {
  constructor(private interviewsRepository: InterviewsRepository) {}

  async execute(
    request: CompleteInterviewRequest,
  ): Promise<CompleteInterviewResponse> {
    const { tenantId, interviewId, feedback, rating, recommendation } =
      request;

    const interview = await this.interviewsRepository.findById(
      new UniqueEntityID(interviewId),
      tenantId,
    );

    if (!interview) {
      throw new ResourceNotFoundError('Entrevista não encontrada');
    }

    if (interview.status !== 'SCHEDULED') {
      throw new BadRequestError(
        'Apenas entrevistas agendadas podem ser concluídas',
      );
    }

    if (!feedback || feedback.trim().length === 0) {
      throw new BadRequestError('O feedback é obrigatório');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestError('A avaliação deve ser entre 1 e 5');
    }

    if (
      !VALID_RECOMMENDATIONS.includes(
        recommendation as (typeof VALID_RECOMMENDATIONS)[number],
      )
    ) {
      throw new BadRequestError(
        `Recomendação inválida. Recomendações válidas: ${VALID_RECOMMENDATIONS.join(', ')}`,
      );
    }

    const updatedInterview = await this.interviewsRepository.update({
      id: new UniqueEntityID(interviewId),
      status: 'COMPLETED',
      feedback: feedback.trim(),
      rating,
      recommendation,
      completedAt: new Date(),
    });

    if (!updatedInterview) {
      throw new ResourceNotFoundError('Entrevista não encontrada');
    }

    return { interview: updatedInterview };
  }
}
