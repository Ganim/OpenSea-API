import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEItemsRepository } from '@/repositories/hr/ppe-items-repository';

export interface DeletePPEItemRequest {
  tenantId: string;
  ppeItemId: string;
}

export class DeletePPEItemUseCase {
  constructor(private ppeItemsRepository: PPEItemsRepository) {}

  async execute(request: DeletePPEItemRequest): Promise<void> {
    const { tenantId, ppeItemId } = request;

    const existingItem = await this.ppeItemsRepository.findById(
      new UniqueEntityID(ppeItemId),
      tenantId,
    );

    if (!existingItem) {
      throw new ResourceNotFoundError('EPI não encontrado');
    }

    await this.ppeItemsRepository.softDelete(new UniqueEntityID(ppeItemId));
  }
}
