import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Activity } from '@/entities/sales/activity';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyActivitiesPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  dealId?: string;
  contactId?: string;
  type?: string;
  status?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivitiesRepository {
  create(activity: Activity): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Activity | null>;
  findManyPaginated(
    params: FindManyActivitiesPaginatedParams,
  ): Promise<PaginatedResult<Activity>>;
  findManyByDeal(dealId: string, tenantId: string): Promise<Activity[]>;
  save(activity: Activity): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
