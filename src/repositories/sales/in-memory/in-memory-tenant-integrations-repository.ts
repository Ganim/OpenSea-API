import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TenantIntegration } from '@/entities/sales/tenant-integration';
import type {
  CreateTenantIntegrationSchema,
  TenantIntegrationsRepository,
  UpdateTenantIntegrationSchema,
} from '../tenant-integrations-repository';

export class InMemoryTenantIntegrationsRepository
  implements TenantIntegrationsRepository
{
  public items: TenantIntegration[] = [];

  async create(
    data: CreateTenantIntegrationSchema,
  ): Promise<TenantIntegration> {
    const tenantIntegration = TenantIntegration.create({
      tenantId: new UniqueEntityID(data.tenantId),
      integrationId: new UniqueEntityID(data.integrationId),
      config: data.config,
      status: data.status,
    });

    this.items.push(tenantIntegration);
    return tenantIntegration;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TenantIntegration | null> {
    const tenantIntegration = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return tenantIntegration ?? null;
  }

  async findByTenantAndIntegration(
    tenantId: string,
    integrationId: string,
  ): Promise<TenantIntegration | null> {
    const tenantIntegration = this.items.find(
      (item) =>
        item.tenantId.toString() === tenantId &&
        item.integrationId.toString() === integrationId,
    );
    return tenantIntegration ?? null;
  }

  async findManyByTenant(tenantId: string): Promise<TenantIntegration[]> {
    return this.items.filter((item) => item.tenantId.toString() === tenantId);
  }

  async update(
    data: UpdateTenantIntegrationSchema,
  ): Promise<TenantIntegration | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(data.id) && item.tenantId.toString() === data.tenantId,
    );

    if (index === -1) return null;

    const existing = this.items[index];
    if (data.config !== undefined) existing.config = data.config;
    if (data.status !== undefined) existing.status = data.status;
    if (data.lastSyncAt !== undefined) existing.lastSyncAt = data.lastSyncAt;
    if (data.errorMessage !== undefined)
      existing.errorMessage = data.errorMessage ?? undefined;

    return existing;
  }

  async save(tenantIntegration: TenantIntegration): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(tenantIntegration.id),
    );

    if (index >= 0) {
      this.items[index] = tenantIntegration;
    }
  }
}
