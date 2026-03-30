import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEItem } from '@/entities/hr/ppe-item';
import type { PPEItemsRepository } from '@/repositories/hr/ppe-items-repository';

export interface AdjustPPEItemStockRequest {
  tenantId: string;
  ppeItemId: string;
  adjustment: number;
}

export interface AdjustPPEItemStockResponse {
  ppeItem: PPEItem;
}

export class AdjustPPEItemStockUseCase {
  constructor(private ppeItemsRepository: PPEItemsRepository) {}

  async execute(
    request: AdjustPPEItemStockRequest,
  ): Promise<AdjustPPEItemStockResponse> {
    const { tenantId, ppeItemId, adjustment } = request;

    if (adjustment === 0) {
      throw new BadRequestError('O ajuste de estoque não pode ser zero');
    }

    const existingItem = await this.ppeItemsRepository.findById(
      new UniqueEntityID(ppeItemId),
      tenantId,
    );

    if (!existingItem) {
      throw new ResourceNotFoundError('EPI não encontrado');
    }

    const newStock = existingItem.currentStock + adjustment;
    if (newStock < 0) {
      throw new BadRequestError(
        'O ajuste resultaria em estoque negativo. Estoque atual: ' +
          existingItem.currentStock,
      );
    }

    const ppeItem = await this.ppeItemsRepository.adjustStock({
      id: new UniqueEntityID(ppeItemId),
      adjustment,
    });

    if (!ppeItem) {
      throw new ResourceNotFoundError('EPI não encontrado');
    }

    return { ppeItem };
  }
}
