import type { TenantFeatureFlag } from '@/entities/core/tenant-feature-flag';

export interface TenantFeatureFlagDTO {
  id: string;
  tenantId: string;
  flag: string;
  enabled: boolean;
  category: string;
  expiresAt: Date | null;
  enabledByUserId: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export function tenantFeatureFlagToDTO(
  flag: TenantFeatureFlag,
): TenantFeatureFlagDTO {
  return {
    id: flag.tenantFeatureFlagId.toString(),
    tenantId: flag.tenantId.toString(),
    flag: flag.flag,
    enabled: flag.enabled,
    category: flag.category,
    expiresAt: flag.expiresAt,
    enabledByUserId: flag.enabledByUserId,
    notes: flag.notes,
    metadata: flag.metadata,
    createdAt: flag.createdAt,
    updatedAt: flag.updatedAt,
  };
}
