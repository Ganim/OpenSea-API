import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Objective } from '@/entities/hr/objective';
import type { ObjectivesRepository } from '@/repositories/hr/objectives-repository';

export interface GetObjectiveRequest {
  tenantId: string;
  objectiveId: string;
}

export interface GetObjectiveResponse {
  objective: Objective;
}

export class GetObjectiveUseCase {
  constructor(private objectivesRepository: ObjectivesRepository) {}

  async execute(request: GetObjectiveRequest): Promise<GetObjectiveResponse> {
    const objective = await this.objectivesRepository.findById(
      new UniqueEntityID(request.objectiveId),
      request.tenantId,
    );

    if (!objective) {
      throw new Error('Objective not found');
    }

    return { objective };
  }
}
