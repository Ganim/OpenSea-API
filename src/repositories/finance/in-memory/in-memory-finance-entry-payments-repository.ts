import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceEntryPayment } from '@/entities/finance/finance-entry-payment';
import type {
  FinanceEntryPaymentsRepository,
  CreateFinanceEntryPaymentSchema,
} from '../finance-entry-payments-repository';

export class InMemoryFinanceEntryPaymentsRepository implements FinanceEntryPaymentsRepository {
  public items: FinanceEntryPayment[] = [];

  async create(data: CreateFinanceEntryPaymentSchema): Promise<FinanceEntryPayment> {
    const payment = FinanceEntryPayment.create({
      entryId: new UniqueEntityID(data.entryId),
      bankAccountId: data.bankAccountId ? new UniqueEntityID(data.bankAccountId) : undefined,
      amount: data.amount,
      paidAt: data.paidAt,
      method: data.method,
      reference: data.reference,
      notes: data.notes,
      createdBy: data.createdBy,
    });

    this.items.push(payment);
    return payment;
  }

  async findByEntryId(entryId: UniqueEntityID): Promise<FinanceEntryPayment[]> {
    return this.items.filter((i) => i.entryId.toString() === entryId.toString());
  }

  async findById(id: UniqueEntityID): Promise<FinanceEntryPayment | null> {
    const item = this.items.find((i) => i.id.toString() === id.toString());
    return item ?? null;
  }

  async sumByEntryId(entryId: UniqueEntityID): Promise<number> {
    return this.items
      .filter((i) => i.entryId.toString() === entryId.toString())
      .reduce((sum, i) => sum + i.amount, 0);
  }
}
