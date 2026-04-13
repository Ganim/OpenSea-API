import { ProductionOrdersRepository } from '@/repositories/production/production-orders-repository';

interface CountProductionOrdersByStatusUseCaseRequest {
  tenantId: string;
}

interface CountProductionOrdersByStatusUseCaseResponse {
  counts: Record<string, number>;
}

export class CountProductionOrdersByStatusUseCase {
  constructor(private productionOrdersRepository: ProductionOrdersRepository) {}

  async execute({
    tenantId,
  }: CountProductionOrdersByStatusUseCaseRequest): Promise<CountProductionOrdersByStatusUseCaseResponse> {
    const counts =
      await this.productionOrdersRepository.countByStatus(tenantId);

    return {
      counts,
    };
  }
}
