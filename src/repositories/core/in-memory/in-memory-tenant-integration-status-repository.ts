import type { TenantIntegrationStatus } from '@/entities/core/tenant-integration-status';
import type { TenantIntegrationStatusRepository } from '../tenant-integration-status-repository';

export class InMemoryTenantIntegrationStatusRepository
  implements TenantIntegrationStatusRepository
{
  public items: TenantIntegrationStatus[] = [];

  async findByTenantId(tenantId: string): Promise<TenantIntegrationStatus[]> {
    return this.items.filter((item) => item.tenantId === tenantId);
  }

  async findByTenantAndType(
    tenantId: string,
    type: string,
  ): Promise<TenantIntegrationStatus | null> {
    const integration = this.items.find(
      (item) => item.tenantId === tenantId && item.integrationType === type,
    );

    return integration ?? null;
  }

  async findAllByType(type: string): Promise<TenantIntegrationStatus[]> {
    return this.items.filter((item) => item.integrationType === type);
  }

  async upsert(entity: TenantIntegrationStatus): Promise<void> {
    const existingIndex = this.items.findIndex(
      (item) =>
        item.tenantId === entity.tenantId &&
        item.integrationType === entity.integrationType,
    );

    if (existingIndex !== -1) {
      this.items[existingIndex] = entity;
    } else {
      this.items.push(entity);
    }
  }
}
