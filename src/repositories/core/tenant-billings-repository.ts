import type { TenantBilling } from '@/entities/core/tenant-billing';

export interface TenantBillingsRepository {
  findByTenantId(tenantId: string): Promise<TenantBilling[]>;
  findByTenantAndPeriod(
    tenantId: string,
    period: string,
  ): Promise<TenantBilling | null>;
  findByStatus(status: string): Promise<TenantBilling[]>;
  create(entity: TenantBilling): Promise<void>;
  save(entity: TenantBilling): Promise<void>;
}
