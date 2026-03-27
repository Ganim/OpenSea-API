import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantIntegration } from '@/entities/sales/tenant-integration';

export interface CreateTenantIntegrationSchema {
  tenantId: string;
  integrationId: string;
  config: Record<string, unknown>;
  status: string;
}

export interface UpdateTenantIntegrationSchema {
  id: UniqueEntityID;
  tenantId: string;
  config?: Record<string, unknown>;
  status?: string;
  lastSyncAt?: Date;
  errorMessage?: string | null;
}

export interface TenantIntegrationsRepository {
  create(data: CreateTenantIntegrationSchema): Promise<TenantIntegration>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<TenantIntegration | null>;
  findByTenantAndIntegration(
    tenantId: string,
    integrationId: string,
  ): Promise<TenantIntegration | null>;
  findManyByTenant(tenantId: string): Promise<TenantIntegration[]>;
  update(
    data: UpdateTenantIntegrationSchema,
  ): Promise<TenantIntegration | null>;
  save(tenantIntegration: TenantIntegration): Promise<void>;
}
