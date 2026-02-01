import { Tenant } from '@/entities/core/tenant';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreateTenantSchema,
  TenantsRepository,
  UpdateTenantSchema,
} from '../tenants-repository';

export class InMemoryTenantsRepository implements TenantsRepository {
  public items: Tenant[] = [];

  async create(data: CreateTenantSchema): Promise<Tenant> {
    const tenant = Tenant.create({
      name: data.name,
      slug: data.slug,
      logoUrl: data.logoUrl ?? null,
      status: data.status ?? 'ACTIVE',
      settings: data.settings ?? {},
      metadata: data.metadata ?? {},
    });

    this.items.push(tenant);

    return tenant;
  }

  async update(data: UpdateTenantSchema): Promise<Tenant | null> {
    const tenant = this.items.find(
      (item) => item.id.equals(data.id) && item.deletedAt === null,
    );
    if (!tenant) return null;

    if (data.name !== undefined) tenant.name = data.name;
    if (data.logoUrl !== undefined) tenant.logoUrl = data.logoUrl;
    if (data.status !== undefined) tenant.status = data.status;
    if (data.settings !== undefined) tenant.settings = data.settings;
    if (data.metadata !== undefined) tenant.metadata = data.metadata;

    return tenant;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const tenant = this.items.find(
      (item) => item.id.equals(id) && item.deletedAt === null,
    );

    if (tenant) {
      tenant.delete();
    }
  }

  async findById(id: UniqueEntityID): Promise<Tenant | null> {
    const tenant = this.items.find(
      (item) => item.id.equals(id) && item.deletedAt === null,
    );

    return tenant ?? null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = this.items.find(
      (item) => item.slug === slug && item.deletedAt === null,
    );

    return tenant ?? null;
  }

  async findMany(page: number, perPage: number): Promise<Tenant[]> {
    const active = this.items.filter((item) => item.deletedAt === null);
    const start = (page - 1) * perPage;

    return active.slice(start, start + perPage);
  }

  async countAll(): Promise<number> {
    return this.items.filter((item) => item.deletedAt === null).length;
  }
}
