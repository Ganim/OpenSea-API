import type { TenantFeatureFlag } from '@/entities/core/tenant-feature-flag';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface CreateTenantFeatureFlagSchema {
  tenantId: UniqueEntityID;
  flag: string;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TenantFeatureFlagsRepository {
  create(data: CreateTenantFeatureFlagSchema): Promise<TenantFeatureFlag>;
  findByTenantAndFlag(
    tenantId: UniqueEntityID,
    flag: string,
  ): Promise<TenantFeatureFlag | null>;
  findByTenant(tenantId: UniqueEntityID): Promise<TenantFeatureFlag[]>;
  updateFlag(
    tenantId: UniqueEntityID,
    flag: string,
    enabled: boolean,
  ): Promise<TenantFeatureFlag | null>;
  deleteFlag(tenantId: UniqueEntityID, flag: string): Promise<void>;
}
