import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { TenantConsumption } from '@/entities/core/tenant-consumption';
import type { TenantConsumptionsRepository } from '@/repositories/core/tenant-consumptions-repository';

interface OverrideTenantLimitUseCaseRequest {
  tenantId: string;
  metric: string;
  newLimit: number;
  expiresAt?: Date;
  notes?: string;
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
    expiresAt: _expiresAt,
    notes: _notes,
  }: OverrideTenantLimitUseCaseRequest): Promise<OverrideTenantLimitUseCaseResponse> {
    if (newLimit < 0) {
      throw new BadRequestError('Limit must be a non-negative number');
    }

    const currentPeriod = this.getCurrentPeriod();

    const existingConsumption =
      await this.tenantConsumptionsRepository.findByTenantPeriodAndMetric(
        tenantId,
        currentPeriod,
        metric,
      );

    if (existingConsumption) {
      existingConsumption.limit = newLimit;

      await this.tenantConsumptionsRepository.upsert(existingConsumption);

      return { consumption: existingConsumption };
    }

    const newConsumption = TenantConsumption.create({
      tenantId,
      period: currentPeriod,
      metric,
      limit: newLimit,
    });

    await this.tenantConsumptionsRepository.upsert(newConsumption);

    return { consumption: newConsumption };
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
