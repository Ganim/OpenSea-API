import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceEntryPayment } from '@/entities/finance/finance-entry-payment';
import type { PaymentMethod } from '@/entities/finance/finance-entry-types';
import type {
  FinanceEntryPaymentsRepository,
  CreateFinanceEntryPaymentSchema,
} from '../finance-entry-payments-repository';
import type { InMemoryFinanceEntriesRepository } from './in-memory-finance-entries-repository';

export class InMemoryFinanceEntryPaymentsRepository
  implements FinanceEntryPaymentsRepository
{
  public items: FinanceEntryPayment[] = [];

  /**
   * Optional back-reference to the entries repo used by `sumSettledBetween`
   * to resolve entry.type / tenantId / bankAccountId (a JOIN in the Prisma
   * implementation). Test setups wire it when they exercise paths that need
   * that information; otherwise the method returns 0 safely.
   */
  public entriesRepository?: InMemoryFinanceEntriesRepository;

  async create(
    data: CreateFinanceEntryPaymentSchema,
    _tx?: unknown,
  ): Promise<FinanceEntryPayment> {
    const payment = FinanceEntryPayment.create({
      entryId: new UniqueEntityID(data.entryId),
      bankAccountId: data.bankAccountId
        ? new UniqueEntityID(data.bankAccountId)
        : undefined,
      amount: data.amount,
      paidAt: data.paidAt,
      method: data.method as PaymentMethod | undefined,
      reference: data.reference,
      notes: data.notes,
      idempotencyKey: data.idempotencyKey,
      createdBy: data.createdBy,
    });

    this.items.push(payment);
    return payment;
  }

  async findByEntryId(entryId: UniqueEntityID): Promise<FinanceEntryPayment[]> {
    return this.items.filter(
      (i) => i.entryId.toString() === entryId.toString(),
    );
  }

  async findById(id: UniqueEntityID): Promise<FinanceEntryPayment | null> {
    const item = this.items.find((i) => i.id.toString() === id.toString());
    return item ?? null;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    _tx?: unknown,
  ): Promise<FinanceEntryPayment | null> {
    const payment = this.items.find((i) => i.idempotencyKey === idempotencyKey);
    return payment ?? null;
  }

  async sumByEntryId(entryId: UniqueEntityID, _tx?: unknown): Promise<number> {
    return this.items
      .filter((i) => i.entryId.toString() === entryId.toString())
      .reduce((sum, i) => sum + i.amount, 0);
  }

  async sumSettledBetween(
    tenantId: string,
    from: Date,
    to: Date,
    entryType: 'RECEIVABLE' | 'PAYABLE',
    bankAccountId?: string,
  ): Promise<number> {
    if (!this.entriesRepository) return 0;
    const entries = this.entriesRepository.items;

    return this.items
      .filter((p) => p.paidAt >= from && p.paidAt <= to)
      .filter((p) => {
        const entry = entries.find(
          (e) => e.id.toString() === p.entryId.toString(),
        );
        if (!entry) return false;
        if (entry.tenantId.toString() !== tenantId) return false;
        if (entry.type !== entryType) return false;
        if (bankAccountId) {
          const paymentBank = p.bankAccountId?.toString();
          const entryBank = entry.bankAccountId?.toString();
          if (paymentBank !== bankAccountId && entryBank !== bankAccountId) {
            return false;
          }
        }
        return true;
      })
      .reduce((sum, p) => sum + p.amount, 0);
  }
}
