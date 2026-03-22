import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CustomerPortalAccess } from '@/entities/sales/customer-portal-access';

export interface CreateCustomerPortalAccessSchema {
  tenantId: string;
  customerId: string;
  accessToken: string;
  contactId?: string;
  isActive?: boolean;
  permissions?: Record<string, boolean>;
  expiresAt?: Date;
}

export interface CustomerPortalAccessesRepository {
  create(data: CreateCustomerPortalAccessSchema): Promise<CustomerPortalAccess>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CustomerPortalAccess | null>;
  findByToken(accessToken: string): Promise<CustomerPortalAccess | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: {
      customerId?: string;
      isActive?: boolean;
    },
  ): Promise<CustomerPortalAccess[]>;
  countMany(
    tenantId: string,
    filters?: {
      customerId?: string;
      isActive?: boolean;
    },
  ): Promise<number>;
  save(access: CustomerPortalAccess): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
