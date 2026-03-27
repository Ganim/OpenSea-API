import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProcessBlueprint } from '@/entities/sales/process-blueprint';
import type { ProcessBlueprintsRepository } from '@/repositories/sales/process-blueprints-repository';

interface GetBlueprintByIdUseCaseRequest {
  tenantId: string;
  blueprintId: string;
}

interface GetBlueprintByIdUseCaseResponse {
  blueprint: ProcessBlueprint;
}

export class GetBlueprintByIdUseCase {
  constructor(private blueprintsRepository: ProcessBlueprintsRepository) {}

  async execute(
    request: GetBlueprintByIdUseCaseRequest,
  ): Promise<GetBlueprintByIdUseCaseResponse> {
    const { tenantId, blueprintId } = request;

    const blueprint = await this.blueprintsRepository.findById(
      new UniqueEntityID(blueprintId),
      tenantId,
    );

    if (!blueprint) {
      throw new ResourceNotFoundError('Blueprint not found');
    }

    return { blueprint };
  }
}
