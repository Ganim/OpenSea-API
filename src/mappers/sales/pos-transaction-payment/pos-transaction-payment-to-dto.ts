import type { PosTransactionPayment } from '@/entities/sales/pos-transaction-payment';

export interface PosTransactionPaymentDTO {
  id: string;
  tenantId: string;
  transactionId: string;
  method: string;
  amount: number;
  receivedAmount: number | null;
  changeAmount: number | null;
  installments: number;
  authCode: string | null;
  nsu: string | null;
  pixTxId: string | null;
  paymentLinkUrl: string | null;
  paymentLinkStatus: string | null;
  tefTransactionId: string | null;
  notes: string | null;
  createdAt: Date;
}

export function posTransactionPaymentToDTO(
  payment: PosTransactionPayment,
): PosTransactionPaymentDTO {
  return {
    id: payment.id.toString(),
    tenantId: payment.tenantId.toString(),
    transactionId: payment.transactionId.toString(),
    method: payment.method,
    amount: payment.amount,
    receivedAmount: payment.receivedAmount ?? null,
    changeAmount: payment.changeAmount ?? null,
    installments: payment.installments,
    authCode: payment.authCode ?? null,
    nsu: payment.nsu ?? null,
    pixTxId: payment.pixTxId ?? null,
    paymentLinkUrl: payment.paymentLinkUrl ?? null,
    paymentLinkStatus: payment.paymentLinkStatus ?? null,
    tefTransactionId: payment.tefTransactionId ?? null,
    notes: payment.notes ?? null,
    createdAt: payment.createdAt,
  };
}
