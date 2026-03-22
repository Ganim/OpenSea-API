import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OrderReturn } from '@/entities/sales/order-return';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyOrderReturnsPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  orderId?: string;
}

export interface OrderReturnsRepository {
  create(orderReturn: OrderReturn): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<OrderReturn | null>;
  findManyByOrder(
    orderId: UniqueEntityID,
    tenantId: string,
  ): Promise<OrderReturn[]>;
  findManyPaginated(
    params: FindManyOrderReturnsPaginatedParams,
  ): Promise<PaginatedResult<OrderReturn>>;
  save(orderReturn: OrderReturn): Promise<void>;
  getNextReturnNumber(tenantId: string): Promise<string>;
}
