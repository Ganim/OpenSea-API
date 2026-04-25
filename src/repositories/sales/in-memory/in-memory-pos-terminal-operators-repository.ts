import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminalOperator } from '@/entities/sales/pos-terminal-operator';
import type { TransactionClient } from '@/lib/transaction-manager';
import type { PaginatedResult } from '@/repositories/pagination-params';

import type {
  FindManyPosTerminalOperatorsByTerminalParams,
  PosTerminalOperatorsRepository,
} from '../pos-terminal-operators-repository';

export class InMemoryPosTerminalOperatorsRepository
  implements PosTerminalOperatorsRepository
{
  public items: PosTerminalOperator[] = [];

  async create(
    operator: PosTerminalOperator,
    _tx?: TransactionClient,
  ): Promise<void> {
    this.items.push(operator);
  }

  async save(
    operator: PosTerminalOperator,
    _tx?: TransactionClient,
  ): Promise<void> {
    const index = this.items.findIndex(
      (o) => o.id.toString() === operator.id.toString(),
    );
    if (index >= 0) this.items[index] = operator;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalOperator | null> {
    return (
      this.items.find(
        (o) => o.id.toString() === id.toString() && o.tenantId === tenantId,
      ) ?? null
    );
  }

  async findByTerminalAndEmployee(
    terminalId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalOperator | null> {
    return (
      this.items.find(
        (o) =>
          o.terminalId.toString() === terminalId.toString() &&
          o.employeeId.toString() === employeeId.toString() &&
          o.tenantId === tenantId,
      ) ?? null
    );
  }

  async findActiveByTerminalId(
    terminalId: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminalOperator[]> {
    return this.items.filter(
      (o) =>
        o.terminalId.toString() === terminalId.toString() &&
        o.tenantId === tenantId &&
        o.isActive &&
        !o.revokedAt,
    );
  }

  async findManyByTerminalIdPaginated(
    params: FindManyPosTerminalOperatorsByTerminalParams,
  ): Promise<PaginatedResult<PosTerminalOperator>> {
    let filtered = this.items.filter(
      (o) =>
        o.terminalId.toString() === params.terminalId &&
        o.tenantId === params.tenantId,
    );

    if (!params.includeRevoked) {
      filtered = filtered.filter((o) => !o.revokedAt);
    }

    // Sort by assignedAt DESC so newest-first mirrors the Prisma impl.
    filtered = [...filtered].sort(
      (a, b) => b.assignedAt.getTime() - a.assignedAt.getTime(),
    );

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
