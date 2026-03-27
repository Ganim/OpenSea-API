import { randomUUID } from 'node:crypto';
import type {
  CustomerPortalAccessesRepository,
  CustomerPortalAccessRecord,
  CreateCustomerPortalAccessSchema,
} from '../customer-portal-accesses-repository';

export class InMemoryCustomerPortalAccessesRepository
  implements CustomerPortalAccessesRepository
{
  public items: CustomerPortalAccessRecord[] = [];

  async create(
    data: CreateCustomerPortalAccessSchema,
  ): Promise<CustomerPortalAccessRecord> {
    const record: CustomerPortalAccessRecord = {
      id: randomUUID(),
      tenantId: data.tenantId,
      customerId: data.customerId,
      customerName: data.customerName,
      accessToken: data.accessToken,
      contactId: null,
      isActive: true,
      permissions: {},
      lastAccessAt: null,
      expiresAt: data.expiresAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.push(record);
    return record;
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<CustomerPortalAccessRecord | null> {
    return (
      this.items.find((i) => i.id === id && i.tenantId === tenantId) ?? null
    );
  }

  async findByToken(token: string): Promise<CustomerPortalAccessRecord | null> {
    return this.items.find((i) => i.accessToken === token) ?? null;
  }

  async findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<CustomerPortalAccessRecord | null> {
    return (
      this.items.find(
        (i) =>
          i.tenantId === tenantId && i.customerId === customerId && i.isActive,
      ) ?? null
    );
  }

  async findMany(tenantId: string): Promise<CustomerPortalAccessRecord[]> {
    return this.items
      .filter((i) => i.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deactivate(id: string, tenantId: string): Promise<void> {
    const item = this.items.find((i) => i.id === id && i.tenantId === tenantId);
    if (item) {
      item.isActive = false;
      item.updatedAt = new Date();
    }
  }

  async updateLastAccess(id: string): Promise<void> {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.lastAccessAt = new Date();
      item.updatedAt = new Date();
    }
  }
}
