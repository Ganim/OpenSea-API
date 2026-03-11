import { Tenant } from '@/entities/core/tenant';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreateTenantSchema,
  TenantsListFilters,
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
    if (data.slug !== undefined) tenant.slug = data.slug;
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

  private applyFilters(
    items: Tenant[],
    filters?: TenantsListFilters,
  ): Tenant[] {
    let result = items.filter((item) => item.deletedAt === null);

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.slug.toLowerCase().includes(searchLower),
      );
    }

    if (filters?.status) {
      result = result.filter((item) => item.status === filters.status);
    }

    return result;
  }

  async findMany(
    page: number,
    perPage: number,
    filters?: TenantsListFilters,
  ): Promise<Tenant[]> {
    const filtered = this.applyFilters(this.items, filters);
    const start = (page - 1) * perPage;

    return filtered.slice(start, start + perPage);
  }

  async countAll(filters?: TenantsListFilters): Promise<number> {
    return this.applyFilters(this.items, filters).length;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const active = this.items.filter((item) => item.deletedAt === null);
    const result: Record<string, number> = {};
    for (const tenant of active) {
      result[tenant.status] = (result[tenant.status] ?? 0) + 1;
    }
    return result;
  }

  async countMonthlyGrowth(
    months: number,
  ): Promise<Array<{ month: string; count: number }>> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const active = this.items.filter(
      (item) => item.deletedAt === null && item.createdAt >= startDate,
    );

    const grouped: Record<string, number> = {};
    for (const tenant of active) {
      const month = `${tenant.createdAt.getFullYear()}-${String(tenant.createdAt.getMonth() + 1).padStart(2, '0')}`;
      grouped[month] = (grouped[month] ?? 0) + 1;
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }

  async countTenantsByPlanTier(): Promise<Record<string, number>> {
    // In-memory: returns empty (no plan association in this simple repo)
    return {};
  }

  async countTotalUsers(): Promise<number> {
    // In-memory: returns 0 (no user tracking in this simple repo)
    return 0;
  }

  async calculateMrr(): Promise<number> {
    // In-memory: returns 0 (no plan pricing in this simple repo)
    return 0;
  }
}
