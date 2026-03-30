import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { KeyResult } from '@/entities/hr/key-result';
import type { KeyResultsRepository } from '@/repositories/hr/key-results-repository';
import type { ObjectivesRepository } from '@/repositories/hr/objectives-repository';

export interface CreateKeyResultRequest {
  tenantId: string;
  objectiveId: string;
  title: string;
  description?: string;
  type: string;
  startValue?: number;
  targetValue: number;
  unit?: string;
  weight?: number;
}

export interface CreateKeyResultResponse {
  keyResult: KeyResult;
}

export class CreateKeyResultUseCase {
  constructor(
    private objectivesRepository: ObjectivesRepository,
    private keyResultsRepository: KeyResultsRepository,
  ) {}

  async execute(
    request: CreateKeyResultRequest,
  ): Promise<CreateKeyResultResponse> {
    const objectiveId = new UniqueEntityID(request.objectiveId);

    const objective = await this.objectivesRepository.findById(
      objectiveId,
      request.tenantId,
    );

    if (!objective) {
      throw new Error('Objective not found');
    }

    const keyResult = await this.keyResultsRepository.create({
      tenantId: request.tenantId,
      objectiveId,
      title: request.title,
      description: request.description,
      type: request.type,
      startValue: request.startValue,
      targetValue: request.targetValue,
      unit: request.unit,
      weight: request.weight,
    });

    return { keyResult };
  }
}
