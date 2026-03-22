import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Catalog } from '@/entities/sales/catalog';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CatalogsRepository,
  FindManyCatalogsParams,
} from '@/repositories/sales/catalogs-repository';

export class InMemoryCatalogsRepository implements CatalogsRepository {
  public items: Catalog[] = [];

  async create(catalog: Catalog): Promise<void> {
    this.items.push(catalog);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Catalog | null> {
    return (
      this.items.find(
        (c) =>
          c.id.toString() === id.toString() &&
          c.tenantId.toString() === tenantId &&
          !c.isDeleted,
      ) ?? null
    );
  }

  async findBySlug(slug: string, tenantId: string): Promise<Catalog | null> {
    return (
      this.items.find(
        (c) =>
          c.slug === slug && c.tenantId.toString() === tenantId && !c.isDeleted,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyCatalogsParams,
  ): Promise<PaginatedResult<Catalog>> {
    let filtered = this.items.filter(
      (c) => c.tenantId.toString() === params.tenantId && !c.isDeleted,
    );

    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          (c.description?.toLowerCase().includes(s) ?? false),
      );
    }

    if (params.status) {
      filtered = filtered.filter((c) => c.status === params.status);
    }

    if (params.type) {
      filtered = filtered.filter((c) => c.type === params.type);
    }

    if (params.isPublic !== undefined) {
      filtered = filtered.filter((c) => c.isPublic === params.isPublic);
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(catalog: Catalog): Promise<void> {
    const index = this.items.findIndex(
      (c) => c.id.toString() === catalog.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = catalog;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex(
      (c) => c.id.toString() === id.toString(),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
