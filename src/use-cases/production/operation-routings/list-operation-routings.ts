import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OperationRoutingsRepository } from '@/repositories/production/operation-routings-repository';

interface ListOperationRoutingsUseCaseRequest {
  tenantId: string;
  bomId: string;
}

interface ListOperationRoutingsUseCaseResponse {
  operationRoutings: import('@/entities/production/operation-routing').ProductionOperationRouting[];
}

export class ListOperationRoutingsUseCase {
  constructor(
    private operationRoutingsRepository: OperationRoutingsRepository,
  ) {}

  async execute({
    tenantId,
    bomId,
  }: ListOperationRoutingsUseCaseRequest): Promise<ListOperationRoutingsUseCaseResponse> {
    const operationRoutings =
      await this.operationRoutingsRepository.findManyByBomId(
        new UniqueEntityID(bomId),
        tenantId,
      );

    return { operationRoutings };
  }
}
