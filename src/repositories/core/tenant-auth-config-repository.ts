import type { TenantAuthConfig } from '@/entities/core/tenant-auth-config';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AuthLinkProvider } from '@/entities/core/auth-link';

export interface CreateTenantAuthConfigSchema {
  tenantId: UniqueEntityID;
  allowedMethods?: AuthLinkProvider[];
  magicLinkEnabled?: boolean;
  magicLinkExpiresIn?: number;
  defaultMethod?: AuthLinkProvider | null;
}

export interface UpdateTenantAuthConfigSchema {
  id: UniqueEntityID;
  allowedMethods?: AuthLinkProvider[];
  magicLinkEnabled?: boolean;
  magicLinkExpiresIn?: number;
  defaultMethod?: AuthLinkProvider | null;
}

export interface TenantAuthConfigRepository {
  create(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig>;
  findByTenantId(tenantId: UniqueEntityID): Promise<TenantAuthConfig | null>;
  update(data: UpdateTenantAuthConfigSchema): Promise<TenantAuthConfig | null>;
  upsert(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig>;
}
