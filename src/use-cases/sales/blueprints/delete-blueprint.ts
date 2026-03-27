import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProcessBlueprintsRepository } from '@/repositories/sales/process-blueprints-repository';

interface DeleteBlueprintUseCaseRequest {
  tenantId: string;
  blueprintId: string;
}

export class DeleteBlueprintUseCase {
  constructor(private blueprintsRepository: ProcessBlueprintsRepository) {}

  async execute(request: DeleteBlueprintUseCaseRequest): Promise<void> {
    const { tenantId, blueprintId } = request;

    const blueprint = await this.blueprintsRepository.findById(
      new UniqueEntityID(blueprintId),
      tenantId,
    );

    if (!blueprint) {
      throw new ResourceNotFoundError('Blueprint not found');
    }

    await this.blueprintsRepository.delete(
      new UniqueEntityID(blueprintId),
      tenantId,
    );
  }
}
