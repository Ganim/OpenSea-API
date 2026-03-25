import type { TenantConsumption } from '@/entities/core/tenant-consumption';
import type { TenantConsumptionsRepository } from '../tenant-consumptions-repository';

export class InMemoryTenantConsumptionsRepository
  implements TenantConsumptionsRepository
{
  public items: TenantConsumption[] = [];

  async findByTenantAndPeriod(
    tenantId: string,
    period: string,
  ): Promise<TenantConsumption[]> {
    return this.items.filter(
      (item) => item.tenantId === tenantId && item.period === period,
    );
  }

  async findByTenantPeriodAndMetric(
    tenantId: string,
    period: string,
    metric: string,
  ): Promise<TenantConsumption | null> {
    const consumption = this.items.find(
      (item) =>
        item.tenantId === tenantId &&
        item.period === period &&
        item.metric === metric,
    );

    return consumption ?? null;
  }

  async findByPeriod(period: string): Promise<TenantConsumption[]> {
    return this.items.filter((item) => item.period === period);
  }

  async findByPeriodAndMetricPrefix(
    period: string,
    metricPrefix: string,
  ): Promise<TenantConsumption[]> {
    return this.items.filter(
      (item) => item.period === period && item.metric.startsWith(metricPrefix),
    );
  }

  async upsert(entity: TenantConsumption): Promise<void> {
    const existingIndex = this.items.findIndex(
      (item) =>
        item.tenantId === entity.tenantId &&
        item.period === entity.period &&
        item.metric === entity.metric,
    );

    if (existingIndex !== -1) {
      this.items[existingIndex] = entity;
    } else {
      this.items.push(entity);
    }
  }

  async incrementUsage(
    tenantId: string,
    period: string,
    metric: string,
    amount: number,
  ): Promise<void> {
    const consumption = this.items.find(
      (item) =>
        item.tenantId === tenantId &&
        item.period === period &&
        item.metric === metric,
    );

    if (consumption) {
      consumption.incrementUsage(amount);
    }
  }
}
