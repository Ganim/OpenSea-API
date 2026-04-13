import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OperationRoutingsRepository } from '@/repositories/production/operation-routings-repository';

interface UpdateOperationRoutingUseCaseRequest {
  tenantId: string;
  id: string;
  bomId?: string;
  workstationId?: string | null;
  sequence?: number;
  operationName?: string;
  description?: string | null;
  setupTime?: number;
  executionTime?: number;
  waitTime?: number;
  moveTime?: number;
  isQualityCheck?: boolean;
  isOptional?: boolean;
  skillRequired?: string | null;
  instructions?: string | null;
  imageUrl?: string | null;
}

interface UpdateOperationRoutingUseCaseResponse {
  operationRouting: import('@/entities/production/operation-routing').ProductionOperationRouting;
}

export class UpdateOperationRoutingUseCase {
  constructor(
    private operationRoutingsRepository: OperationRoutingsRepository,
  ) {}

  async execute({
    tenantId,
    id,
    bomId,
    workstationId,
    sequence,
    operationName,
    description,
    setupTime,
    executionTime,
    waitTime,
    moveTime,
    isQualityCheck,
    isOptional,
    skillRequired,
    instructions,
    imageUrl,
  }: UpdateOperationRoutingUseCaseRequest): Promise<UpdateOperationRoutingUseCaseResponse> {
    const existing = await this.operationRoutingsRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Operation routing not found.');
    }

    const updated = await this.operationRoutingsRepository.update({
      id: new UniqueEntityID(id),
      bomId,
      workstationId,
      sequence,
      operationName,
      description,
      setupTime,
      executionTime,
      waitTime,
      moveTime,
      isQualityCheck,
      isOptional,
      skillRequired,
      instructions,
      imageUrl,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Operation routing not found.');
    }

    return { operationRouting: updated };
  }
}
