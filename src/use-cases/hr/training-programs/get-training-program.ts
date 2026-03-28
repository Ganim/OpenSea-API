import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingProgram } from '@/entities/hr/training-program';
import type { TrainingProgramsRepository } from '@/repositories/hr/training-programs-repository';

export interface GetTrainingProgramRequest {
  tenantId: string;
  trainingProgramId: string;
}

export interface GetTrainingProgramResponse {
  trainingProgram: TrainingProgram;
}

export class GetTrainingProgramUseCase {
  constructor(private trainingProgramsRepository: TrainingProgramsRepository) {}

  async execute(
    request: GetTrainingProgramRequest,
  ): Promise<GetTrainingProgramResponse> {
    const { tenantId, trainingProgramId } = request;

    const trainingProgram = await this.trainingProgramsRepository.findById(
      new UniqueEntityID(trainingProgramId),
      tenantId,
    );

    if (!trainingProgram) {
      throw new ResourceNotFoundError('Programa de treinamento não encontrado');
    }

    return { trainingProgram };
  }
}
