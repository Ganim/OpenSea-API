import type { TenantConsumption } from '@/entities/core/tenant-consumption';
import type { TenantConsumptionsRepository } from '@/repositories/core/tenant-consumptions-repository';

interface GetTenantConsumptionUseCaseRequest {
  tenantId: string;
  period?: string;
}

interface GetTenantConsumptionUseCaseResponse {
  consumptions: TenantConsumption[];
}

export class GetTenantConsumptionUseCase {
  constructor(
    private tenantConsumptionsRepository: TenantConsumptionsRepository,
  ) {}

  async execute({
    tenantId,
    period,
  }: GetTenantConsumptionUseCaseRequest): Promise<GetTenantConsumptionUseCaseResponse> {
    const currentPeriod = period ?? new Date().toISOString().slice(0, 7); // YYYY-MM

    const consumptions =
      await this.tenantConsumptionsRepository.findByTenantAndPeriod(
        tenantId,
        currentPeriod,
      );

    return { consumptions };
  }
}
