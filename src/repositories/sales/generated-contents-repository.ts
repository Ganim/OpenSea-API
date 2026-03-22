import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { GeneratedContent } from '@/entities/sales/generated-content';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyGeneratedContentsParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  type?: string;
  status?: string;
  productId?: string;
  catalogId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GeneratedContentsRepository {
  create(content: GeneratedContent): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<GeneratedContent | null>;
  findManyPaginated(
    params: FindManyGeneratedContentsParams,
  ): Promise<PaginatedResult<GeneratedContent>>;
  save(content: GeneratedContent): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
