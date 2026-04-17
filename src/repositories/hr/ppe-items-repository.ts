import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEItem, PPECategory } from '@/entities/hr/ppe-item';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreatePPEItemSchema {
  tenantId: string;
  name: string;
  category: string;
  caNumber?: string;
  manufacturer?: string;
  model?: string;
  expirationMonths?: number;
  minStock?: number;
  currentStock?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdatePPEItemSchema {
  id: UniqueEntityID;
  /**
   * Tenant identifier for multi-tenant write isolation. Optional for backward
   * compatibility during the defense-in-depth rollout, but callers MUST pass
   * it so the underlying Prisma `where` clause is scoped and cannot update a
   * record belonging to another tenant.
   */
  tenantId?: string;
  name?: string;
  category?: string;
  caNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  expirationMonths?: number | null;
  minStock?: number;
  isActive?: boolean;
  notes?: string | null;
}

export interface AdjustPPEItemStockSchema {
  id: UniqueEntityID;
  adjustment: number; // positive to add, negative to subtract
}

export interface FindPPEItemFilters {
  category?: PPECategory;
  isActive?: boolean;
  lowStockOnly?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface PPEItemsRepository {
  create(data: CreatePPEItemSchema): Promise<PPEItem>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PPEItem | null>;
  findMany(
    tenantId: string,
    filters?: FindPPEItemFilters,
  ): Promise<{ ppeItems: PPEItem[]; total: number }>;
  update(data: UpdatePPEItemSchema): Promise<PPEItem | null>;
  adjustStock(data: AdjustPPEItemStockSchema): Promise<PPEItem | null>;
  /**
   * Atomically decrements `currentStock` by `quantity` for the given PPE item,
   * but only when `currentStock >= quantity` AND the row belongs to
   * `tenantId`. Returns the number of rows affected — callers MUST treat 0 as
   * "insufficient stock (or wrong tenant)" and throw a BadRequestError. This
   * closes the TOCTOU race that existed with the previous
   * find-then-adjustStock pattern: two concurrent assign calls could both
   * observe `currentStock=1` and each write `currentStock=0` after decrement
   * when the real truth was "only one could succeed".
   *
   * Accepts an optional `tx` to compose inside a use-case transaction so a
   * subsequent assignment-create failure can roll the decrement back.
   */
  atomicDecrementStock(
    itemId: UniqueEntityID,
    quantity: number,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<{ count: number }>;
  softDelete(id: UniqueEntityID): Promise<void>;
}
