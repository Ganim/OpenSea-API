import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deal } from '@/entities/sales/deal';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyDealsPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  pipelineId?: string;
  stageId?: string;
  status?: string;
  priority?: string;
  customerId?: string;
  assignedToUserId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DealsRepository {
  create(deal: Deal): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Deal | null>;
  findManyPaginated(params: FindManyDealsPaginatedParams): Promise<PaginatedResult<Deal>>;
  findManyByStage(stageId: string, tenantId: string): Promise<Deal[]>;
  save(deal: Deal): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
