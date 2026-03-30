import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ObjectivesRepository } from '@/repositories/hr/objectives-repository';

export interface DeleteObjectiveRequest {
  tenantId: string;
  objectiveId: string;
}

export class DeleteObjectiveUseCase {
  constructor(private objectivesRepository: ObjectivesRepository) {}

  async execute(request: DeleteObjectiveRequest): Promise<void> {
    const objective = await this.objectivesRepository.findById(
      new UniqueEntityID(request.objectiveId),
      request.tenantId,
    );

    if (!objective) {
      throw new Error('Objective not found');
    }

    if (objective.isActive()) {
      throw new Error('Cannot delete an active objective');
    }

    await this.objectivesRepository.delete(
      new UniqueEntityID(request.objectiveId),
    );
  }
}
