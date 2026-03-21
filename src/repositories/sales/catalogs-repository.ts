import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Catalog } from '@/entities/sales/catalog';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyCatalogsParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  type?: string;
  isPublic?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CatalogsRepository {
  create(catalog: Catalog): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Catalog | null>;
  findBySlug(slug: string, tenantId: string): Promise<Catalog | null>;
  findManyPaginated(params: FindManyCatalogsParams): Promise<PaginatedResult<Catalog>>;
  save(catalog: Catalog): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
