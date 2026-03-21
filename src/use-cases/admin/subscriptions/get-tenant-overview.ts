import type { TenantBilling } from '@/entities/core/tenant-billing';
import type { TenantConsumption } from '@/entities/core/tenant-consumption';
import type { TenantSubscription } from '@/entities/core/tenant-subscription';
import type { TenantBillingsRepository } from '@/repositories/core/tenant-billings-repository';
import type { TenantConsumptionsRepository } from '@/repositories/core/tenant-consumptions-repository';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';

interface GetTenantOverviewUseCaseRequest {
  tenantId: string;
  period?: string;
}

interface GetTenantOverviewUseCaseResponse {
  subscriptions: TenantSubscription[];
  consumptions: TenantConsumption[];
  billing: TenantBilling | null;
}

export class GetTenantOverviewUseCase {
  constructor(
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
    private tenantConsumptionsRepository: TenantConsumptionsRepository,
    private tenantBillingsRepository: TenantBillingsRepository,
  ) {}

  async execute({
    tenantId,
    period,
  }: GetTenantOverviewUseCaseRequest): Promise<GetTenantOverviewUseCaseResponse> {
    const currentPeriod = period ?? new Date().toISOString().slice(0, 7);

    const [subscriptions, consumptions, billing] = await Promise.all([
      this.tenantSubscriptionsRepository.findActiveByTenantId(tenantId),
      this.tenantConsumptionsRepository.findByTenantAndPeriod(
        tenantId,
        currentPeriod,
      ),
      this.tenantBillingsRepository.findByTenantAndPeriod(
        tenantId,
        currentPeriod,
      ),
    ]);

    return { subscriptions, consumptions, billing };
  }
}
