import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InterviewStagesRepository } from '@/repositories/hr/interview-stages-repository';

export interface DeleteInterviewStageRequest {
  tenantId: string;
  interviewStageId: string;
}

export interface DeleteInterviewStageResponse {
  success: boolean;
}

export class DeleteInterviewStageUseCase {
  constructor(
    private interviewStagesRepository: InterviewStagesRepository,
  ) {}

  async execute(
    request: DeleteInterviewStageRequest,
  ): Promise<DeleteInterviewStageResponse> {
    const { tenantId, interviewStageId } = request;

    const stage = await this.interviewStagesRepository.findById(
      new UniqueEntityID(interviewStageId),
      tenantId,
    );

    if (!stage) {
      throw new ResourceNotFoundError('Etapa não encontrada');
    }

    await this.interviewStagesRepository.delete(
      new UniqueEntityID(interviewStageId),
    );

    return { success: true };
  }
}
