import type { TenantBilling } from '@/entities/core/tenant-billing';
import type { TenantBillingsRepository } from '../tenant-billings-repository';

export class InMemoryTenantBillingsRepository
  implements TenantBillingsRepository
{
  public items: TenantBilling[] = [];

  async findByTenantId(tenantId: string): Promise<TenantBilling[]> {
    return this.items.filter((item) => item.tenantId === tenantId);
  }

  async findByTenantAndPeriod(
    tenantId: string,
    period: string,
  ): Promise<TenantBilling | null> {
    const billing = this.items.find(
      (item) => item.tenantId === tenantId && item.period === period,
    );

    return billing ?? null;
  }

  async findByStatus(status: string): Promise<TenantBilling[]> {
    return this.items.filter((item) => item.status === status);
  }

  async create(entity: TenantBilling): Promise<void> {
    this.items.push(entity);
  }

  async save(entity: TenantBilling): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(entity.id));

    if (index !== -1) {
      this.items[index] = entity;
    }
  }
}
