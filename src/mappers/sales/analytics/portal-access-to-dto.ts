import type { CustomerPortalAccess } from '@/entities/sales/customer-portal-access';

export interface CustomerPortalAccessDTO {
  id: string;
  customerId: string;
  accessToken: string;
  contactId?: string;
  isActive: boolean;
  permissions: Record<string, boolean>;
  lastAccessAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export function portalAccessToDTO(
  access: CustomerPortalAccess,
): CustomerPortalAccessDTO {
  return {
    id: access.id.toString(),
    customerId: access.customerId,
    accessToken: access.accessToken,
    contactId: access.contactId,
    isActive: access.isActive,
    permissions: access.permissions,
    lastAccessAt: access.lastAccessAt,
    expiresAt: access.expiresAt,
    createdAt: access.createdAt,
    updatedAt: access.updatedAt,
  };
}
