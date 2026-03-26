import type { CashierTransaction } from '@/entities/sales/cashier-transaction';

export interface CashierTransactionDTO {
  id: string;
  sessionId: string;
  type: string;
  amount: number;
  description?: string;
  paymentMethod?: string;
  referenceId?: string;
  createdAt: Date;
}

export function cashierTransactionToDTO(
  transaction: CashierTransaction,
): CashierTransactionDTO {
  const dto: CashierTransactionDTO = {
    id: transaction.id.toString(),
    sessionId: transaction.sessionId.toString(),
    type: transaction.type,
    amount: transaction.amount,
    createdAt: transaction.createdAt,
  };

  if (transaction.description) dto.description = transaction.description;
  if (transaction.paymentMethod) dto.paymentMethod = transaction.paymentMethod;
  if (transaction.referenceId) dto.referenceId = transaction.referenceId;

  return dto;
}
