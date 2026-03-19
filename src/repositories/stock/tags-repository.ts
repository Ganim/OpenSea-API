import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Tag } from '@/entities/stock/tag';
import type {
  PaginatedResult,
  PaginationParams,
} from '@/repositories/pagination-params';

export interface CreateTagSchema {
  tenantId: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
}

export interface UpdateTagSchema {
  id: UniqueEntityID;
  name?: string;
  slug?: string;
  color?: string;
  description?: string;
}

export interface TagsRepository {
  create(data: CreateTagSchema): Promise<Tag>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Tag | null>;
  findBySlug(slug: string, tenantId: string): Promise<Tag | null>;
  findByName(name: string, tenantId: string): Promise<Tag | null>;
  findMany(tenantId: string): Promise<Tag[]>;
  findManyPaginated(
    tenantId: string,
    params: PaginationParams & {
      search?: string;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<PaginatedResult<Tag>>;
  findManyByNames(names: string[], tenantId: string): Promise<Tag[]>;
  update(data: UpdateTagSchema): Promise<Tag | null>;
  save(tag: Tag): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
