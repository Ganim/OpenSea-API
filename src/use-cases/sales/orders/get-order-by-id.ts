import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { OrderItem } from '@/entities/sales/order-item';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface GetOrderByIdUseCaseRequest {
  orderId: string;
  tenantId: string;
}

interface GetOrderByIdUseCaseResponse {
  order: Order;
  items: OrderItem[];
}

export class GetOrderByIdUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
  ) {}

  async execute(
    request: GetOrderByIdUseCaseRequest,
  ): Promise<GetOrderByIdUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(request.orderId),
      request.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    const items = await this.orderItemsRepository.findManyByOrder(
      order.id,
      request.tenantId,
    );

    return { order, items };
  }
}
