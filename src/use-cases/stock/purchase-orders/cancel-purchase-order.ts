import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PurchaseOrderDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import type { PurchaseOrdersRepository } from '@/repositories/stock/purchase-orders-repository';

interface CancelPurchaseOrderUseCaseRequest {
  id: string;
}

interface CancelPurchaseOrderUseCaseResponse {
  purchaseOrder: PurchaseOrderDTO;
}

export class CancelPurchaseOrderUseCase {
  constructor(private purchaseOrdersRepository: PurchaseOrdersRepository) {}

  async execute(
    request: CancelPurchaseOrderUseCaseRequest,
  ): Promise<CancelPurchaseOrderUseCaseResponse> {
    const { id } = request;

    const purchaseOrder = await this.purchaseOrdersRepository.findById(
      new UniqueEntityID(id),
    );

    if (!purchaseOrder) {
      throw new ResourceNotFoundError('Purchase order not found');
    }

    try {
      purchaseOrder.cancel();
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }

    await this.purchaseOrdersRepository.save(purchaseOrder);

    return { purchaseOrder: purchaseOrderToDTO(purchaseOrder) };
  }
}
