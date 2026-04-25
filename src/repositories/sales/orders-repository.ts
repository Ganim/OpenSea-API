import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { TransactionClient } from '@/lib/transaction-manager';
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

export interface FindCashierQueueParams {
  search?: string;
  page?: number;
  limit?: number;
  /**
   * Filter to orders attached to specific terminals (for CASHIER mode that
   * pulls awaiting-payment orders from SALES_ONLY terminals).
   */
  terminalIds?: string[];
  /**
   * Filter to a single terminal (for SALES_WITH_CHECKOUT mode that only sees
   * its own pending orders).
   */
  terminalId?: string;
}

export interface OrdersRepository {
  create(order: Order): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Order | null>;
  findByNumber(orderNumber: string, tenantId: string): Promise<Order | null>;
  findBySaleCode(saleCode: string, tenantId: string): Promise<Order | null>;
  /**
   * Looks up an Order by its `saleLocalUuid` — the client-generated UUID v4
   * the POS terminal assigns to a sale before it is synchronized to the API.
   * This lookup is the canonical idempotency key for `POST /v1/pos/sales`
   * (Emporion Plan A — Task 28): a second sync request bearing the same
   * `saleLocalUuid` must short-circuit to `already_synced` instead of
   * persisting a duplicate Order.
   *
   * Scoped to the tenant; soft-deleted Orders are excluded. Returns `null`
   * when no Order matches.
   */
  findBySaleLocalUuid(
    saleLocalUuid: string,
    tenantId: string,
  ): Promise<Order | null>;
  findCashierQueue(
    tenantId: string,
    params: FindCashierQueueParams,
  ): Promise<PaginatedResult<Order>>;
  findMyDrafts(
    userId: string,
    tenantId: string,
    params: { page?: number; limit?: number },
  ): Promise<PaginatedResult<Order>>;
  findManyPaginated(
    params: FindManyOrdersPaginatedParams,
  ): Promise<PaginatedResult<Order>>;
  /**
   * Persists pending changes on `order`. Optionally accepts a Prisma
   * `TransactionClient` so callers (e.g. fiscal emission — Task 32) can
   * atomically write the Order alongside other updates that share the same
   * transactional scope (such as the tenant fiscal counter increment).
   */
  save(order: Order, tx?: TransactionClient): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
  getNextOrderNumber(tenantId: string): Promise<string>;
  generateOrderNumber(tenantId: string): Promise<string>;
}
