import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import type { PurchaseOrder } from '@/entities/stock/purchase-order';
import type { PurchaseOrderDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import type { PurchaseOrdersRepository } from '@/repositories/stock/purchase-orders-repository';

interface ListPurchaseOrdersUseCaseRequest {
  page?: number;
  perPage?: number;
  supplierId?: string;
  status?: string;
}

interface ListPurchaseOrdersUseCaseResponse {
  purchaseOrders: PurchaseOrderDTO[];
}

export class ListPurchaseOrdersUseCase {
  constructor(private purchaseOrdersRepository: PurchaseOrdersRepository) {}

  async execute(
    request: ListPurchaseOrdersUseCaseRequest,
  ): Promise<ListPurchaseOrdersUseCaseResponse> {
    const { page = 1, perPage = 20, supplierId, status } = request;

    let purchaseOrders: PurchaseOrder[];

    if (supplierId) {
      purchaseOrders = await this.purchaseOrdersRepository.findManyBySupplier(
        new UniqueEntityID(supplierId),
        page,
        perPage,
      );
    } else if (status) {
      purchaseOrders = await this.purchaseOrdersRepository.findManyByStatus(
        OrderStatus.create(status),
        page,
        perPage,
      );
    } else {
      purchaseOrders = await this.purchaseOrdersRepository.findManyByStatus(
        OrderStatus.create('PENDING'),
        page,
        perPage,
      );
    }

    return { purchaseOrders: purchaseOrders.map(purchaseOrderToDTO) };
  }
}
