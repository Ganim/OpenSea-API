import type { TenantConsumption } from '@/entities/core/tenant-consumption';

export interface TenantConsumptionsRepository {
  findByTenantAndPeriod(
    tenantId: string,
    period: string,
  ): Promise<TenantConsumption[]>;
  findByTenantPeriodAndMetric(
    tenantId: string,
    period: string,
    metric: string,
  ): Promise<TenantConsumption | null>;
  upsert(entity: TenantConsumption): Promise<void>;
  incrementUsage(
    tenantId: string,
    period: string,
    metric: string,
    amount: number,
  ): Promise<void>;
}
