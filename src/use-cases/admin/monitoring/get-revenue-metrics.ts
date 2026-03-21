import type { TenantConsumptionsRepository } from '@/repositories/core/tenant-consumptions-repository';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface GetRevenueMetricsUseCaseResponse {
  mrr: number;
  activeSubscriptionCount: number;
  overageTotal: number;
  churnRate: number;
  tenantCountByStatus: Record<string, number>;
  period: string;
}

export class GetRevenueMetricsUseCase {
  constructor(
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
    private tenantConsumptionsRepository: TenantConsumptionsRepository,
    private tenantsRepository: TenantsRepository,
  ) {}

  async execute(): Promise<GetRevenueMetricsUseCaseResponse> {
    const currentPeriod = new Date().toISOString().slice(0, 7);

    const [activeSubscriptions, tenantCountByStatus] = await Promise.all([
      this.tenantSubscriptionsRepository.findAllActive(),
      this.tenantsRepository.countByStatus(),
    ]);

    // Calculate MRR from active subscriptions
    const mrr = activeSubscriptions.reduce((total, subscription) => {
      const price = subscription.customPrice ?? 0;
      const discountMultiplier = subscription.discountPercent
        ? 1 - subscription.discountPercent / 100
        : 1;
      return total + price * subscription.quantity * discountMultiplier;
    }, 0);

    // Calculate overage total from all consumption records for current period
    // We fetch all consumptions (not just AI) for overage calculation
    const allTenantIds = new Set(
      activeSubscriptions.map((sub) => sub.tenantId),
    );
    let overageTotal = 0;

    for (const tenantId of allTenantIds) {
      const consumptions =
        await this.tenantConsumptionsRepository.findByTenantAndPeriod(
          tenantId,
          currentPeriod,
        );
      for (const consumption of consumptions) {
        overageTotal += consumption.overageCost;
      }
    }

    // Churn rate placeholder — would require historical data to calculate
    const churnRate = 0;

    return {
      mrr: Math.round(mrr * 100) / 100,
      activeSubscriptionCount: activeSubscriptions.length,
      overageTotal: Math.round(overageTotal * 100) / 100,
      churnRate,
      tenantCountByStatus,
      period: currentPeriod,
    };
  }
}
