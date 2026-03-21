import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { TenantConsumption } from '@/entities/core/tenant-consumption';
import type { TenantConsumptionsRepository } from '@/repositories/core/tenant-consumptions-repository';

interface OverrideTenantLimitUseCaseRequest {
  tenantId: string;
  metric: string;
  newLimit: number;
  period?: string;
}

interface OverrideTenantLimitUseCaseResponse {
  consumption: TenantConsumption;
}

export class OverrideTenantLimitUseCase {
  constructor(
    private tenantConsumptionsRepository: TenantConsumptionsRepository,
  ) {}

  async execute({
    tenantId,
    metric,
    newLimit,
    period,
  }: OverrideTenantLimitUseCaseRequest): Promise<OverrideTenantLimitUseCaseResponse> {
    if (newLimit < 0) {
      throw new BadRequestError('Limit must be a non-negative number');
    }

    const currentPeriod = period ?? new Date().toISOString().slice(0, 7);

    let consumption =
      await this.tenantConsumptionsRepository.findByTenantPeriodAndMetric(
        tenantId,
        currentPeriod,
        metric,
      );

    if (!consumption) {
      consumption = TenantConsumption.create({
        tenantId,
        period: currentPeriod,
        metric,
        limit: newLimit,
      });
    } else {
      consumption.limit = newLimit;
    }

    await this.tenantConsumptionsRepository.upsert(consumption);

    return { consumption };
  }
}
