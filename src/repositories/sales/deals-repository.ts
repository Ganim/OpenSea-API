import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Deal } from '@/entities/sales/deal';
import type { PaginatedResult, PaginationParams } from '../pagination-params';

export interface CreateDealSchema {
  tenantId: string;
  title: string;
  customerId: string;
  pipelineId: string;
  stageId: string;
  value?: number;
  currency?: string;
  expectedCloseDate?: Date;
  probability?: number;
  status?: string;
  lostReason?: string;
  assignedToUserId?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  previousDealId?: string;
}

export interface UpdateDealSchema {
  id: UniqueEntityID;
  tenantId: string;
  title?: string;
  value?: number;
  currency?: string;
  expectedCloseDate?: Date;
  probability?: number;
  status?: string;
  lostReason?: string;
  assignedToUserId?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface FindManyDealsOptions extends PaginationParams {
  tenantId: string;
  search?: string;
  customerId?: string;
  pipelineId?: string;
  stageId?: string;
  status?: string;
  assignedToUserId?: string;
  sortBy?: 'title' | 'value' | 'createdAt' | 'updatedAt' | 'expectedCloseDate';
  sortOrder?: 'asc' | 'desc';
}

export interface DealsRepository {
  create(data: CreateDealSchema): Promise<Deal>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Deal | null>;
  findManyPaginated(options: FindManyDealsOptions): Promise<PaginatedResult<Deal>>;
  update(data: UpdateDealSchema): Promise<Deal | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  count(tenantId: string): Promise<number>;
  changeStage(id: UniqueEntityID, tenantId: string, stageId: UniqueEntityID): Promise<Deal | null>;
}
