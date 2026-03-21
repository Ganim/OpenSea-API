import type { MarketplaceOrderDTO } from '@/mappers/sales/marketplace/marketplace-order-to-dto';
import { marketplaceOrderToDTO } from '@/mappers/sales/marketplace/marketplace-order-to-dto';
import type { MarketplaceOrdersRepository } from '@/repositories/sales/marketplace-orders-repository';
import type { MarketplaceOrderStatusType } from '@/entities/sales/marketplace-order';

interface ListMarketplaceOrdersUseCaseRequest {
  tenantId: string;
  connectionId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

interface ListMarketplaceOrdersUseCaseResponse {
  orders: MarketplaceOrderDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListMarketplaceOrdersUseCase {
  constructor(private ordersRepository: MarketplaceOrdersRepository) {}

  async execute(
    input: ListMarketplaceOrdersUseCaseRequest,
  ): Promise<ListMarketplaceOrdersUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const status = input.status as MarketplaceOrderStatusType | undefined;

    let orders;
    let total;

    if (input.connectionId) {
      [orders, total] = await Promise.all([
        this.ordersRepository.findManyByConnection(
          input.connectionId,
          page,
          perPage,
          input.tenantId,
        ),
        this.ordersRepository.countByConnection(
          input.connectionId,
          input.tenantId,
        ),
      ]);
    } else {
      [orders, total] = await Promise.all([
        this.ordersRepository.findManyByTenant(
          page,
          perPage,
          input.tenantId,
          status,
        ),
        this.ordersRepository.countByTenant(input.tenantId, status),
      ]);
    }

    return {
      orders: orders.map(marketplaceOrderToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
