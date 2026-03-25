import type { TenantConsumptionsRepository } from '@/repositories/core/tenant-consumptions-repository';

export class ConsumptionTracker {
  constructor(private consumptionsRepository: TenantConsumptionsRepository) {}

  async track(
    tenantId: string,
    metric: string,
    amount: number = 1,
  ): Promise<void> {
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    await this.consumptionsRepository.incrementUsage(
      tenantId,
      period,
      metric,
      amount,
    );
  }
}

// Singleton factory
let instance: ConsumptionTracker | null = null;

export function makeConsumptionTracker(): ConsumptionTracker {
  if (!instance) {
    const {
      PrismaTenantConsumptionsRepository,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
    } = require('@/repositories/core/prisma/prisma-tenant-consumptions-repository');
    instance = new ConsumptionTracker(new PrismaTenantConsumptionsRepository());
  }
  return instance;
}
