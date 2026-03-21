import type { TenantIntegrationStatus } from '@/entities/core/tenant-integration-status';

export interface TenantIntegrationStatusRepository {
  findByTenantId(tenantId: string): Promise<TenantIntegrationStatus[]>;
  findByTenantAndType(
    tenantId: string,
    type: string,
  ): Promise<TenantIntegrationStatus | null>;
  findAllByType(type: string): Promise<TenantIntegrationStatus[]>;
  upsert(entity: TenantIntegrationStatus): Promise<void>;
}
