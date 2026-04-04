import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { Order } from '@/entities/sales/order';
import type { OrderItem } from '@/entities/sales/order-item';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface GetOrderByCodeUseCaseRequest {
  tenantId: string;
  saleCode: string;
}

interface GetOrderByCodeUseCaseResponse {
  order: Order;
  items: OrderItem[];
}

export class GetOrderByCodeUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
  ) {}

  async execute(
    input: GetOrderByCodeUseCaseRequest,
  ): Promise<GetOrderByCodeUseCaseResponse> {
    const order = await this.ordersRepository.findBySaleCode(
      input.saleCode,
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError(
        `Order with sale code "${input.saleCode}" not found.`,
      );
    }

    const items = await this.orderItemsRepository.findManyByOrder(
      order.id,
      input.tenantId,
    );

    return { order, items };
  }
}
