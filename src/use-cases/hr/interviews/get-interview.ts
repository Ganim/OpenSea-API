import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Interview } from '@/entities/hr/interview';
import type { InterviewsRepository } from '@/repositories/hr/interviews-repository';

export interface GetInterviewRequest {
  tenantId: string;
  interviewId: string;
}

export interface GetInterviewResponse {
  interview: Interview;
}

export class GetInterviewUseCase {
  constructor(private interviewsRepository: InterviewsRepository) {}

  async execute(
    request: GetInterviewRequest,
  ): Promise<GetInterviewResponse> {
    const { tenantId, interviewId } = request;

    const interview = await this.interviewsRepository.findById(
      new UniqueEntityID(interviewId),
      tenantId,
    );

    if (!interview) {
      throw new ResourceNotFoundError('Entrevista não encontrada');
    }

    return { interview };
  }
}
