import type { ProductionOrdersRepository } from '@/repositories/production/production-orders-repository';

interface GetProductionDashboardUseCaseRequest {
  tenantId: string;
}

interface GetProductionDashboardUseCaseResponse {
  orderCounts: Record<string, number>;
  totalOrders: number;
  activeOrders: number;
}

const ACTIVE_STATUSES = ['PLANNED', 'FIRM', 'RELEASED', 'IN_PROCESS'];

export class GetProductionDashboardUseCase {
  constructor(private productionOrdersRepository: ProductionOrdersRepository) {}

  async execute({
    tenantId,
  }: GetProductionDashboardUseCaseRequest): Promise<GetProductionDashboardUseCaseResponse> {
    const orderCounts =
      await this.productionOrdersRepository.countByStatus(tenantId);

    let totalOrders = 0;
    let activeOrders = 0;

    for (const [status, count] of Object.entries(orderCounts)) {
      totalOrders += count;
      if (ACTIVE_STATUSES.includes(status)) {
        activeOrders += count;
      }
    }

    return {
      orderCounts,
      totalOrders,
      activeOrders,
    };
  }
}
