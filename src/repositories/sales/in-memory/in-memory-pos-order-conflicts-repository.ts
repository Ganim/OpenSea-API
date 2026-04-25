import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosOrderConflict } from '@/entities/sales/pos-order-conflict';
import type { TransactionClient } from '@/lib/transaction-manager';
import type { PaginatedResult } from '@/repositories/pagination-params';

import type {
  FindManyPosOrderConflictsParams,
  PosOrderConflictsRepository,
} from '../pos-order-conflicts-repository';

export class InMemoryPosOrderConflictsRepository
  implements PosOrderConflictsRepository
{
  public items: PosOrderConflict[] = [];

  async create(
    conflict: PosOrderConflict,
    _tx?: TransactionClient,
  ): Promise<void> {
    this.items.push(conflict);
  }

  async save(
    conflict: PosOrderConflict,
    _tx?: TransactionClient,
  ): Promise<void> {
    const index = this.items.findIndex(
      (c) => c.id.toString() === conflict.id.toString(),
    );
    if (index >= 0) this.items[index] = conflict;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosOrderConflict | null> {
    return (
      this.items.find(
        (c) => c.id.toString() === id.toString() && c.tenantId === tenantId,
      ) ?? null
    );
  }

  async findBySaleLocalUuid(
    saleLocalUuid: string,
    tenantId: string,
  ): Promise<PosOrderConflict | null> {
    return (
      this.items.find(
        (c) => c.saleLocalUuid === saleLocalUuid && c.tenantId === tenantId,
      ) ?? null
    );
  }

  async findManyPaginated(
    params: FindManyPosOrderConflictsParams,
  ): Promise<PaginatedResult<PosOrderConflict>> {
    let filtered = this.items.filter((c) => c.tenantId === params.tenantId);

    if (params.status && params.status.length > 0) {
      const statuses = params.status;
      filtered = filtered.filter((c) => statuses.includes(c.status.value));
    }

    if (params.posTerminalId) {
      filtered = filtered.filter(
        (c) => c.posTerminalId === params.posTerminalId,
      );
    }

    if (params.fromDate) {
      const from = params.fromDate;
      filtered = filtered.filter((c) => c.createdAt >= from);
    }

    if (params.toDate) {
      const to = params.toDate;
      filtered = filtered.filter((c) => c.createdAt <= to);
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
