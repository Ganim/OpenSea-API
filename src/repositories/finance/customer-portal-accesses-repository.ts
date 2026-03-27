export interface CreateCustomerPortalAccessSchema {
  tenantId: string;
  customerId: string;
  customerName: string;
  accessToken: string;
  expiresAt?: Date;
}

export interface CustomerPortalAccessRecord {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string | null;
  accessToken: string;
  contactId: string | null;
  isActive: boolean;
  permissions: unknown;
  lastAccessAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerPortalAccessesRepository {
  create(
    data: CreateCustomerPortalAccessSchema,
  ): Promise<CustomerPortalAccessRecord>;
  findById(
    id: string,
    tenantId: string,
  ): Promise<CustomerPortalAccessRecord | null>;
  findByToken(token: string): Promise<CustomerPortalAccessRecord | null>;
  findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerPortalAccessRecord | null>;
  findMany(tenantId: string): Promise<CustomerPortalAccessRecord[]>;
  deactivate(id: string, tenantId: string): Promise<void>;
  updateLastAccess(id: string): Promise<void>;
}
