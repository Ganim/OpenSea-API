import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyOrdersPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  type?: string;
  channel?: string;
  stageId?: string;
  pipelineId?: string;
  customerId?: string;
  assignedToUserId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrdersRepository {
  create(order: Order): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Order | null>;
  findByNumber(orderNumber: string, tenantId: string): Promise<Order | null>;
  findManyPaginated(
    params: FindManyOrdersPaginatedParams,
  ): Promise<PaginatedResult<Order>>;
  save(order: Order): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  getNextOrderNumber(tenantId: string): Promise<string>;
}
