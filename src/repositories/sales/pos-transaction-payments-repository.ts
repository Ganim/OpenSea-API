import type { PosTransactionPayment } from '@/entities/sales/pos-transaction-payment';

export interface PosTransactionPaymentsRepository {
  create(payment: PosTransactionPayment): Promise<void>;
  createMany(payments: PosTransactionPayment[]): Promise<void>;
  findByTransactionId(transactionId: string): Promise<PosTransactionPayment[]>;
}
