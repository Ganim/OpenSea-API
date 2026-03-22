import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CustomerPortalAccess } from '@/entities/sales/customer-portal-access';
import type {
  CustomerPortalAccessesRepository,
  CreateCustomerPortalAccessSchema,
} from '../customer-portal-accesses-repository';

export class InMemoryCustomerPortalAccessesRepository
  implements CustomerPortalAccessesRepository
{
  public items: CustomerPortalAccess[] = [];

  async create(
    data: CreateCustomerPortalAccessSchema,
  ): Promise<CustomerPortalAccess> {
    const access = CustomerPortalAccess.create({
      tenantId: new UniqueEntityID(data.tenantId),
      customerId: data.customerId,
      accessToken: data.accessToken,
      contactId: data.contactId,
      isActive: data.isActive,
      permissions: data.permissions,
      expiresAt: data.expiresAt,
    });

    this.items.push(access);
    return access;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CustomerPortalAccess | null> {
    return (
      this.items.find(
        (a) =>
          a.id.toString() === id.toString() &&
          a.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByToken(accessToken: string): Promise<CustomerPortalAccess | null> {
    return (
      this.items.find((a) => a.accessToken === accessToken && a.isActive) ??
      null
    );
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { customerId?: string; isActive?: boolean },
  ): Promise<CustomerPortalAccess[]> {
    let filtered = this.items.filter((a) => a.tenantId.toString() === tenantId);

    if (filters?.customerId)
      filtered = filtered.filter((a) => a.customerId === filters.customerId);
    if (filters?.isActive !== undefined)
      filtered = filtered.filter((a) => a.isActive === filters.isActive);

    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }

  async countMany(
    tenantId: string,
    filters?: { customerId?: string; isActive?: boolean },
  ): Promise<number> {
    let filtered = this.items.filter((a) => a.tenantId.toString() === tenantId);

    if (filters?.customerId)
      filtered = filtered.filter((a) => a.customerId === filters.customerId);
    if (filters?.isActive !== undefined)
      filtered = filtered.filter((a) => a.isActive === filters.isActive);

    return filtered.length;
  }

  async save(access: CustomerPortalAccess): Promise<void> {
    const index = this.items.findIndex(
      (a) => a.id.toString() === access.id.toString(),
    );
    if (index >= 0) {
      this.items[index] = access;
    }
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const index = this.items.findIndex(
      (a) =>
        a.id.toString() === id.toString() && a.tenantId.toString() === tenantId,
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
