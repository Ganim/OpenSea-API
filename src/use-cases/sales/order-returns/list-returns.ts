import type { OrderReturn } from '@/entities/sales/order-return';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { OrderReturnsRepository } from '@/repositories/sales/order-returns-repository';

interface ListReturnsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  orderId?: string;
}

interface ListReturnsUseCaseResponse {
  returns: OrderReturn[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListReturnsUseCase {
  constructor(
    private orderReturnsRepository: OrderReturnsRepository,
  ) {}

  async execute(
    request: ListReturnsUseCaseRequest,
  ): Promise<ListReturnsUseCaseResponse> {
    const result: PaginatedResult<OrderReturn> =
      await this.orderReturnsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        search: request.search,
        status: request.status,
        orderId: request.orderId,
      });

    return {
      returns: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
