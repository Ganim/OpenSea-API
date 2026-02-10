import type { ConsortiumPayment } from '@/entities/finance/consortium-payment';

export interface ConsortiumPaymentDTO {
  id: string;
  consortiumId: string;
  bankAccountId?: string;
  installmentNumber: number;
  dueDate: Date;
  expectedAmount: number;
  paidAmount?: number;
  paidAt?: Date;
  status: string;
  isPaid: boolean;
  isOverdue: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export function consortiumPaymentToDTO(
  payment: ConsortiumPayment,
): ConsortiumPaymentDTO {
  return {
    id: payment.id.toString(),
    consortiumId: payment.consortiumId.toString(),
    bankAccountId: payment.bankAccountId?.toString(),
    installmentNumber: payment.installmentNumber,
    dueDate: payment.dueDate,
    expectedAmount: payment.expectedAmount,
    paidAmount: payment.paidAmount,
    paidAt: payment.paidAt,
    status: payment.status,
    isPaid: payment.isPaid,
    isOverdue: payment.isOverdue,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}
