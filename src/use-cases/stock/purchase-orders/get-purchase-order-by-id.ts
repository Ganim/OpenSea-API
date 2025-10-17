import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PurchaseOrder } from '@/entities/stock/purchase-order';
import type { PurchaseOrdersRepository } from '@/repositories/stock/purchase-orders-repository';

interface GetPurchaseOrderByIdUseCaseRequest {
  id: string;
}

interface GetPurchaseOrderByIdUseCaseResponse {
  purchaseOrder: PurchaseOrder;
}

export class GetPurchaseOrderByIdUseCase {
  constructor(private purchaseOrdersRepository: PurchaseOrdersRepository) {}

  async execute(
    request: GetPurchaseOrderByIdUseCaseRequest,
  ): Promise<GetPurchaseOrderByIdUseCaseResponse> {
    const { id } = request;

    const purchaseOrder = await this.purchaseOrdersRepository.findById(
      new UniqueEntityID(id),
    );

    if (!purchaseOrder) {
      throw new ResourceNotFoundError('Purchase order not found');
    }

    return { purchaseOrder };
  }
}
