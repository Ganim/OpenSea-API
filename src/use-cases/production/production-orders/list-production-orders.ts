import type { ProductionOrderStatus } from '@/entities/production/production-order';
import { ProductionOrdersRepository } from '@/repositories/production/production-orders-repository';

interface ListProductionOrdersUseCaseRequest {
  tenantId: string;
  status?: ProductionOrderStatus;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListProductionOrdersUseCaseResponse {
  productionOrders: import('@/entities/production/production-order').ProductionOrder[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListProductionOrdersUseCase {
  constructor(
    private productionOrdersRepository: ProductionOrdersRepository,
  ) {}

  async execute({
    tenantId,
    status,
    search,
    page = 1,
    limit = 20,
  }: ListProductionOrdersUseCaseRequest): Promise<ListProductionOrdersUseCaseResponse> {
    let allOrders: import('@/entities/production/production-order').ProductionOrder[];

    if (status) {
      allOrders = await this.productionOrdersRepository.findManyByStatus(
        tenantId,
        status,
      );
    } else {
      allOrders = await this.productionOrdersRepository.findMany(tenantId);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      allOrders = allOrders.filter((order) =>
        order.orderNumber.toLowerCase().includes(searchLower),
      );
    }

    const total = allOrders.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const productionOrders = allOrders.slice(start, start + limit);

    return {
      productionOrders,
      meta: {
        total,
        page,
        limit,
        pages,
      },
    };
  }
}
