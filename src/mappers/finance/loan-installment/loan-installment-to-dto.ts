import type { LoanInstallment } from '@/entities/finance/loan-installment';

export interface LoanInstallmentDTO {
  id: string;
  loanId: string;
  bankAccountId?: string;
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  paidAmount?: number;
  paidAt?: Date;
  status: string;
  isPaid: boolean;
  isOverdue: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export function loanInstallmentToDTO(
  installment: LoanInstallment,
): LoanInstallmentDTO {
  return {
    id: installment.id.toString(),
    loanId: installment.loanId.toString(),
    bankAccountId: installment.bankAccountId?.toString(),
    installmentNumber: installment.installmentNumber,
    dueDate: installment.dueDate,
    principalAmount: installment.principalAmount,
    interestAmount: installment.interestAmount,
    totalAmount: installment.totalAmount,
    paidAmount: installment.paidAmount,
    paidAt: installment.paidAt,
    status: installment.status,
    isPaid: installment.isPaid,
    isOverdue: installment.isOverdue,
    createdAt: installment.createdAt,
    updatedAt: installment.updatedAt,
  };
}
