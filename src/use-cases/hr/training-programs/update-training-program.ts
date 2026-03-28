import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingProgram } from '@/entities/hr/training-program';
import type { TrainingProgramsRepository } from '@/repositories/hr/training-programs-repository';

export interface UpdateTrainingProgramRequest {
  tenantId: string;
  trainingProgramId: string;
  name?: string;
  description?: string;
  category?: string;
  format?: string;
  durationHours?: number;
  instructor?: string;
  maxParticipants?: number;
  isActive?: boolean;
  isMandatory?: boolean;
  validityMonths?: number;
}

export interface UpdateTrainingProgramResponse {
  trainingProgram: TrainingProgram;
}

export class UpdateTrainingProgramUseCase {
  constructor(private trainingProgramsRepository: TrainingProgramsRepository) {}

  async execute(
    request: UpdateTrainingProgramRequest,
  ): Promise<UpdateTrainingProgramResponse> {
    const { tenantId, trainingProgramId, name, ...updateData } = request;

    const existingProgram = await this.trainingProgramsRepository.findById(
      new UniqueEntityID(trainingProgramId),
      tenantId,
    );

    if (!existingProgram) {
      throw new ResourceNotFoundError('Programa de treinamento não encontrado');
    }

    if (name !== undefined && name.trim().length === 0) {
      throw new BadRequestError(
        'O nome do programa de treinamento é obrigatório',
      );
    }

    const updatedProgram = await this.trainingProgramsRepository.update({
      id: new UniqueEntityID(trainingProgramId),
      name: name?.trim(),
      ...updateData,
    });

    if (!updatedProgram) {
      throw new ResourceNotFoundError('Programa de treinamento não encontrado');
    }

    return { trainingProgram: updatedProgram };
  }
}
