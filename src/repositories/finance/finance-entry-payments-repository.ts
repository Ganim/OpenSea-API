import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntryPayment } from '@/entities/finance/finance-entry-payment';

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
  create(data: CreateFinanceEntryPaymentSchema): Promise<FinanceEntryPayment>;
  findByEntryId(entryId: UniqueEntityID): Promise<FinanceEntryPayment[]>;
  findById(id: UniqueEntityID): Promise<FinanceEntryPayment | null>;
  sumByEntryId(entryId: UniqueEntityID): Promise<number>;
}
