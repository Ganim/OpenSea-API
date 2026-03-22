import type { PosTransactionPayment } from '@/entities/sales/pos-transaction-payment';
import type { PosTransactionPaymentsRepository } from '../pos-transaction-payments-repository';

export class InMemoryPosTransactionPaymentsRepository
  implements PosTransactionPaymentsRepository
{
  public items: PosTransactionPayment[] = [];

  async create(payment: PosTransactionPayment): Promise<void> {
    this.items.push(payment);
  }

  async createMany(payments: PosTransactionPayment[]): Promise<void> {
    this.items.push(...payments);
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<PosTransactionPayment[]> {
    return this.items.filter(
      (p) => p.transactionId.toString() === transactionId,
    );
  }
}
