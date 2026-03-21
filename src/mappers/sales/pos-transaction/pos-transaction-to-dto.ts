import type { PosTransaction } from '@/entities/sales/pos-transaction';

export interface PosTransactionDTO {
  id: string;
  tenantId: string;
  sessionId: string;
  orderId: string;
  transactionNumber: number;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  changeAmount: number;
  customerId: string | null;
  customerName: string | null;
  customerDocument: string | null;
  overrideByUserId: string | null;
  overrideReason: string | null;
  syncedAt: Date | null;
  createdAt: Date;
}

export function posTransactionToDTO(
  transaction: PosTransaction,
): PosTransactionDTO {
  return {
    id: transaction.id.toString(),
    tenantId: transaction.tenantId.toString(),
    sessionId: transaction.sessionId.toString(),
    orderId: transaction.orderId.toString(),
    transactionNumber: transaction.transactionNumber,
    status: transaction.status,
    subtotal: transaction.subtotal,
    discountTotal: transaction.discountTotal,
    taxTotal: transaction.taxTotal,
    grandTotal: transaction.grandTotal,
    changeAmount: transaction.changeAmount,
    customerId: transaction.customerId?.toString() ?? null,
    customerName: transaction.customerName ?? null,
    customerDocument: transaction.customerDocument ?? null,
    overrideByUserId: transaction.overrideByUserId?.toString() ?? null,
    overrideReason: transaction.overrideReason ?? null,
    syncedAt: transaction.syncedAt ?? null,
    createdAt: transaction.createdAt,
  };
}
