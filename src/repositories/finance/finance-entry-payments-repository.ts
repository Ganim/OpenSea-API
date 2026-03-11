import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntryPayment } from '@/entities/finance/finance-entry-payment';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateFinanceEntryPaymentSchema {
  entryId: string;
  bankAccountId?: string;
  amount: number;
  paidAt: Date;
  method?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
}

export interface FinanceEntryPaymentsRepository {
  create(
    data: CreateFinanceEntryPaymentSchema,
    tx?: TransactionClient,
  ): Promise<FinanceEntryPayment>;
  findByEntryId(entryId: UniqueEntityID): Promise<FinanceEntryPayment[]>;
  findById(id: UniqueEntityID): Promise<FinanceEntryPayment | null>;
  sumByEntryId(
    entryId: UniqueEntityID,
    tx?: TransactionClient,
  ): Promise<number>;
}
