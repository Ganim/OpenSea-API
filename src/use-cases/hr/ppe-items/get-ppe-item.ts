import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEItem } from '@/entities/hr/ppe-item';
import type { PPEItemsRepository } from '@/repositories/hr/ppe-items-repository';

export interface GetPPEItemRequest {
  tenantId: string;
  ppeItemId: string;
}

export interface GetPPEItemResponse {
  ppeItem: PPEItem;
}

export class GetPPEItemUseCase {
  constructor(private ppeItemsRepository: PPEItemsRepository) {}

  async execute(request: GetPPEItemRequest): Promise<GetPPEItemResponse> {
    const { tenantId, ppeItemId } = request;

    const ppeItem = await this.ppeItemsRepository.findById(
      new UniqueEntityID(ppeItemId),
      tenantId,
    );

    if (!ppeItem) {
      throw new ResourceNotFoundError('EPI não encontrado');
    }

    return { ppeItem };
  }
}
