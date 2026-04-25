import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosOrderConflict } from '@/entities/sales/pos-order-conflict';
import type { PosOrderConflictStatusValue } from '@/entities/sales/value-objects/pos-order-conflict-status';
import type { TransactionClient } from '@/lib/transaction-manager';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyPosOrderConflictsParams {
  tenantId: string;
  page: number;
  limit: number;
  status?: PosOrderConflictStatusValue[];
  posTerminalId?: string;
  /**
   * Filter by `posOperatorEmployeeId`. Added by Emporion Plan A — Task 30
   * (`GET /v1/admin/pos/conflicts`). When omitted, conflicts of every operator
   * are returned. When provided, only conflicts whose `posOperatorEmployeeId`
   * exactly matches are returned (rows where the column is `null` are
   * excluded — those represent terminal-level / anonymous conflicts).
   */
  operatorEmployeeId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PosOrderConflictsRepository {
  create(conflict: PosOrderConflict, tx?: TransactionClient): Promise<void>;
  save(conflict: PosOrderConflict, tx?: TransactionClient): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosOrderConflict | null>;
  findBySaleLocalUuid(
    saleLocalUuid: string,
    tenantId: string,
  ): Promise<PosOrderConflict | null>;
  findManyPaginated(
    params: FindManyPosOrderConflictsParams,
  ): Promise<PaginatedResult<PosOrderConflict>>;
}
