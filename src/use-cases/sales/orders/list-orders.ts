import type { Order } from '@/entities/sales/order';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface ListOrdersUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  type?: string;
  channel?: string;
  stageId?: string;
  pipelineId?: string;
  customerId?: string;
  assignedToUserId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListOrdersUseCaseResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListOrdersUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute(
    request: ListOrdersUseCaseRequest,
  ): Promise<ListOrdersUseCaseResponse> {
    const result: PaginatedResult<Order> =
      await this.ordersRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        search: request.search,
        type: request.type,
        channel: request.channel,
        stageId: request.stageId,
        pipelineId: request.pipelineId,
        customerId: request.customerId,
        assignedToUserId: request.assignedToUserId,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      });

    return {
      orders: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
