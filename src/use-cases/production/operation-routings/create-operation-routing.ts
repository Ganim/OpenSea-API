import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BomsRepository } from '@/repositories/production/boms-repository';
import { OperationRoutingsRepository } from '@/repositories/production/operation-routings-repository';

interface CreateOperationRoutingUseCaseRequest {
  tenantId: string;
  bomId: string;
  workstationId?: string;
  sequence: number;
  operationName: string;
  description?: string;
  setupTime: number;
  executionTime: number;
  waitTime: number;
  moveTime: number;
  isQualityCheck?: boolean;
  isOptional?: boolean;
  skillRequired?: string;
  instructions?: string;
  imageUrl?: string;
}

interface CreateOperationRoutingUseCaseResponse {
  operationRouting: import('@/entities/production/operation-routing').ProductionOperationRouting;
}

export class CreateOperationRoutingUseCase {
  constructor(
    private operationRoutingsRepository: OperationRoutingsRepository,
    private bomsRepository: BomsRepository,
  ) {}

  async execute({
    tenantId,
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
  }: CreateOperationRoutingUseCaseRequest): Promise<CreateOperationRoutingUseCaseResponse> {
    const bom = await this.bomsRepository.findById(
      new UniqueEntityID(bomId),
      tenantId,
    );

    if (!bom) {
      throw new ResourceNotFoundError('BOM not found.');
    }

    // Validate unique [bomId, sequence] per tenant
    const existingRoutings =
      await this.operationRoutingsRepository.findManyByBomId(
        new UniqueEntityID(bomId),
        tenantId,
      );

    const duplicate = existingRoutings.find((r) => r.sequence === sequence);
    if (duplicate) {
      throw new BadRequestError(
        'An operation routing with this sequence already exists for this BOM.',
      );
    }

    const operationRouting = await this.operationRoutingsRepository.create({
      tenantId,
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

    return { operationRouting };
  }
}
