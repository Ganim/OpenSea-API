import type { Order } from '@/entities/sales/order';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface GetMyDraftsUseCaseRequest {
  tenantId: string;
  userId: string;
  page?: number;
  limit?: number;
}

interface GetMyDraftsUseCaseResponse {
  orders: PaginatedResult<Order>;
}

export class GetMyDraftsUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute(
    input: GetMyDraftsUseCaseRequest,
  ): Promise<GetMyDraftsUseCaseResponse> {
    const orders = await this.ordersRepository.findMyDrafts(
      input.userId,
      input.tenantId,
      {
        page: input.page,
        limit: input.limit,
      },
    );

    return { orders };
  }
}
