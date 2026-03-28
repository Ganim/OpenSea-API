import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingProgram } from '@/entities/hr/training-program';
import type { TrainingProgramsRepository } from '@/repositories/hr/training-programs-repository';

export interface DeleteTrainingProgramRequest {
  tenantId: string;
  trainingProgramId: string;
}

export interface DeleteTrainingProgramResponse {
  trainingProgram: TrainingProgram;
}

export class DeleteTrainingProgramUseCase {
  constructor(private trainingProgramsRepository: TrainingProgramsRepository) {}

  async execute(
    request: DeleteTrainingProgramRequest,
  ): Promise<DeleteTrainingProgramResponse> {
    const { tenantId, trainingProgramId } = request;

    const trainingProgram = await this.trainingProgramsRepository.findById(
      new UniqueEntityID(trainingProgramId),
      tenantId,
    );

    if (!trainingProgram) {
      throw new ResourceNotFoundError('Programa de treinamento não encontrado');
    }

    trainingProgram.softDelete();

    await this.trainingProgramsRepository.delete(
      new UniqueEntityID(trainingProgramId),
    );

    return { trainingProgram };
  }
}
