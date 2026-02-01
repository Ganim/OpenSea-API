import type { TenantUser } from '@/entities/core/tenant-user';

export interface TenantUserDTO {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function tenantUserToDTO(tenantUser: TenantUser): TenantUserDTO {
  return {
    id: tenantUser.tenantUserId.toString(),
    tenantId: tenantUser.tenantId.toString(),
    userId: tenantUser.userId.toString(),
    role: tenantUser.role,
    joinedAt: tenantUser.joinedAt,
    createdAt: tenantUser.createdAt,
    updatedAt: tenantUser.updatedAt,
  };
}
