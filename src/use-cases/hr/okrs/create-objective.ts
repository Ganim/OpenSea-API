import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Objective } from '@/entities/hr/objective';
import type { ObjectivesRepository } from '@/repositories/hr/objectives-repository';

export interface CreateObjectiveRequest {
  tenantId: string;
  title: string;
  description?: string;
  ownerId: string;
  parentId?: string;
  level: string;
  period: string;
  startDate: Date;
  endDate: Date;
}

export interface CreateObjectiveResponse {
  objective: Objective;
}

export class CreateObjectiveUseCase {
  constructor(private objectivesRepository: ObjectivesRepository) {}

  async execute(
    request: CreateObjectiveRequest,
  ): Promise<CreateObjectiveResponse> {
    if (request.endDate <= request.startDate) {
      throw new Error('End date must be after start date');
    }

    if (request.parentId) {
      const parentObjective = await this.objectivesRepository.findById(
        new UniqueEntityID(request.parentId),
        request.tenantId,
      );

      if (!parentObjective) {
        throw new Error('Parent objective not found');
      }
    }

    const objective = await this.objectivesRepository.create({
      tenantId: request.tenantId,
      title: request.title,
      description: request.description,
      ownerId: new UniqueEntityID(request.ownerId),
      parentId: request.parentId
        ? new UniqueEntityID(request.parentId)
        : undefined,
      level: request.level,
      period: request.period,
      startDate: request.startDate,
      endDate: request.endDate,
    });

    return { objective };
  }
}
