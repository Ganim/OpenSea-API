import type { FinanceEntryPayment } from '@/entities/finance/finance-entry-payment';

export interface FinanceEntryPaymentDTO {
  id: string;
  entryId: string;
  bankAccountId?: string;
  amount: number;
  paidAt: Date;
  method?: string;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

export function financeEntryPaymentToDTO(payment: FinanceEntryPayment): FinanceEntryPaymentDTO {
  return {
    id: payment.id.toString(),
    entryId: payment.entryId.toString(),
    bankAccountId: payment.bankAccountId?.toString(),
    amount: payment.amount,
    paidAt: payment.paidAt,
    method: payment.method,
    reference: payment.reference,
    notes: payment.notes,
    createdBy: payment.createdBy,
    createdAt: payment.createdAt,
  };
}
