import type { TenantConsumption } from '@/entities/core/tenant-consumption';
import type { TenantConsumptionsRepository } from '@/repositories/core/tenant-consumptions-repository';

interface GetTenantConsumptionUseCaseRequest {
  tenantId: string;
  period?: string;
}

interface GetTenantConsumptionUseCaseResponse {
  consumptions: TenantConsumption[];
  period: string;
}

export class GetTenantConsumptionUseCase {
  constructor(
    private tenantConsumptionsRepository: TenantConsumptionsRepository,
  ) {}

  async execute({
    tenantId,
    period,
  }: GetTenantConsumptionUseCaseRequest): Promise<GetTenantConsumptionUseCaseResponse> {
    const resolvedPeriod = period ?? this.getCurrentPeriod();

    const consumptions =
      await this.tenantConsumptionsRepository.findByTenantAndPeriod(
        tenantId,
        resolvedPeriod,
      );

    return {
      consumptions,
      period: resolvedPeriod,
    };
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
