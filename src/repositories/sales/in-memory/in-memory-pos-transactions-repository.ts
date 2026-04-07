import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTransaction } from '@/entities/sales/pos-transaction';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyPosTransactionsPaginatedParams,
  PosTransactionsRepository,
} from '../pos-transactions-repository';

export class InMemoryPosTransactionsRepository
  implements PosTransactionsRepository
{
  public items: PosTransaction[] = [];

  async create(transaction: PosTransaction): Promise<void> {
    this.items.push(transaction);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTransaction | null> {
    return (
      this.items.find(
        (t) =>
          t.id.toString() === id.toString() &&
          t.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByOrderId(
    orderId: string,
    tenantId: string,
  ): Promise<PosTransaction | null> {
    return (
      this.items
        .filter(
          (transaction) =>
            transaction.orderId.toString() === orderId &&
            transaction.tenantId.toString() === tenantId,
        )
        .sort((leftTransaction, rightTransaction) => {
          return (
            rightTransaction.createdAt.getTime() -
            leftTransaction.createdAt.getTime()
          );
        })[0] ?? null
    );
  }

  async findManyPaginated(
    params: FindManyPosTransactionsPaginatedParams,
  ): Promise<PaginatedResult<PosTransaction>> {
    let filtered = this.items.filter(
      (t) => t.tenantId.toString() === params.tenantId,
    );

    if (params.sessionId) {
      filtered = filtered.filter(
        (t) => t.sessionId.toString() === params.sessionId,
      );
    }
    if (params.status) {
      filtered = filtered.filter((t) => t.status === params.status);
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

  async getNextTransactionNumber(sessionId: string): Promise<number> {
    const sessionTxns = this.items.filter(
      (t) => t.sessionId.toString() === sessionId,
    );
    const maxNum = sessionTxns.reduce(
      (max, t) => Math.max(max, t.transactionNumber),
      0,
    );
    return maxNum + 1;
  }

  async save(transaction: PosTransaction): Promise<void> {
    const index = this.items.findIndex(
      (t) => t.id.toString() === transaction.id.toString(),
    );
    if (index >= 0) this.items[index] = transaction;
  }
}
