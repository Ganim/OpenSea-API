import type { Order } from '@/entities/sales/order';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface GetCashierQueueUseCaseRequest {
  tenantId: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface GetCashierQueueUseCaseResponse {
  orders: PaginatedResult<Order>;
}

export class GetCashierQueueUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute(
    input: GetCashierQueueUseCaseRequest,
  ): Promise<GetCashierQueueUseCaseResponse> {
    const orders = await this.ordersRepository.findCashierQueue(
      input.tenantId,
      {
        search: input.search,
        page: input.page,
        limit: input.limit,
      },
    );

    return { orders };
  }
}
