import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CashierTransaction } from '@/entities/sales/cashier-transaction';
import type {
  CashierTransactionsRepository,
  CreateCashierTransactionSchema,
} from '../cashier-transactions-repository';

export class InMemoryCashierTransactionsRepository
  implements CashierTransactionsRepository
{
  public items: CashierTransaction[] = [];

  async create(
    data: CreateCashierTransactionSchema,
  ): Promise<CashierTransaction> {
    const transaction = CashierTransaction.create({
      sessionId: new UniqueEntityID(data.sessionId),
      type: data.type,
      amount: data.amount,
      description: data.description,
      paymentMethod: data.paymentMethod,
      referenceId: data.referenceId,
    });

    this.items.push(transaction);
    return transaction;
  }

  async findBySessionId(
    sessionId: UniqueEntityID,
  ): Promise<CashierTransaction[]> {
    return this.items
      .filter((item) => item.sessionId.equals(sessionId))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findMany(
    page: number,
    perPage: number,
    sessionId: UniqueEntityID,
  ): Promise<CashierTransaction[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter((item) => item.sessionId.equals(sessionId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + perPage);
  }

  async countBySessionId(sessionId: UniqueEntityID): Promise<number> {
    return this.items.filter((item) => item.sessionId.equals(sessionId)).length;
  }
}
