import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Objective } from '@/entities/hr/objective';
import type { ObjectivesRepository } from '@/repositories/hr/objectives-repository';

export interface UpdateObjectiveRequest {
  tenantId: string;
  objectiveId: string;
  title?: string;
  description?: string;
  ownerId?: string;
  level?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export interface UpdateObjectiveResponse {
  objective: Objective;
}

export class UpdateObjectiveUseCase {
  constructor(private objectivesRepository: ObjectivesRepository) {}

  async execute(
    request: UpdateObjectiveRequest,
  ): Promise<UpdateObjectiveResponse> {
    const existingObjective = await this.objectivesRepository.findById(
      new UniqueEntityID(request.objectiveId),
      request.tenantId,
    );

    if (!existingObjective) {
      throw new Error('Objective not found');
    }

    const objective = await this.objectivesRepository.update({
      id: new UniqueEntityID(request.objectiveId),
      title: request.title,
      description: request.description,
      ownerId: request.ownerId
        ? new UniqueEntityID(request.ownerId)
        : undefined,
      level: request.level,
      period: request.period,
      startDate: request.startDate,
      endDate: request.endDate,
      status: request.status,
    });

    return { objective: objective! };
  }
}
