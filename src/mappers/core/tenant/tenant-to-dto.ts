import type { Tenant } from '@/entities/core/tenant';

export interface TenantDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSummaryDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: string;
}

export function tenantToDTO(tenant: Tenant): TenantDTO {
  return {
    id: tenant.tenantId.toString(),
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    status: tenant.status,
    settings: tenant.settings,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
}

export function tenantToSummaryDTO(tenant: Tenant): TenantSummaryDTO {
  return {
    id: tenant.tenantId.toString(),
    name: tenant.name,
    slug: tenant.slug,
    logoUrl: tenant.logoUrl,
    status: tenant.status,
  };
}
