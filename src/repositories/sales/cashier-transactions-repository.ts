import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CashierTransaction } from '@/entities/sales/cashier-transaction';

export interface CreateCashierTransactionSchema {
  sessionId: string;
  type: 'SALE' | 'REFUND' | 'CASH_IN' | 'CASH_OUT';
  amount: number;
  description?: string;
  paymentMethod?: string;
  referenceId?: string;
}

export interface CashierTransactionsRepository {
  create(data: CreateCashierTransactionSchema): Promise<CashierTransaction>;
  findBySessionId(sessionId: UniqueEntityID): Promise<CashierTransaction[]>;
  findMany(page: number, perPage: number, sessionId: UniqueEntityID): Promise<CashierTransaction[]>;
  countBySessionId(sessionId: UniqueEntityID): Promise<number>;
}
