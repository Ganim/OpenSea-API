import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PurchaseOrderDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import type { PurchaseOrdersRepository } from '@/repositories/stock/purchase-orders-repository';

interface GetPurchaseOrderByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetPurchaseOrderByIdUseCaseResponse {
  purchaseOrder: PurchaseOrderDTO;
}

export class GetPurchaseOrderByIdUseCase {
  constructor(private purchaseOrdersRepository: PurchaseOrdersRepository) {}

  async execute(
    request: GetPurchaseOrderByIdUseCaseRequest,
  ): Promise<GetPurchaseOrderByIdUseCaseResponse> {
    const { tenantId, id } = request;

    const purchaseOrder = await this.purchaseOrdersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!purchaseOrder) {
      throw new ResourceNotFoundError('Purchase order not found');
    }

    return { purchaseOrder: purchaseOrderToDTO(purchaseOrder) };
  }
}
