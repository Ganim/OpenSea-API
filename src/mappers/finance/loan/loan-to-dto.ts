import type { Loan } from '@/entities/finance/loan';

export interface LoanDTO {
  id: string;
  tenantId: string;
  bankAccountId: string;
  costCenterId: string;
  name: string;
  type: string;
  contractNumber?: string;
  status: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  interestType?: string;
  startDate: Date;
  endDate?: Date;
  totalInstallments: number;
  paidInstallments: number;
  installmentDay?: number;
  notes?: string;
  isActive: boolean;
  isDefaulted: boolean;
  progressPercentage: number;
  remainingInstallments: number;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function loanToDTO(loan: Loan): LoanDTO {
  return {
    id: loan.id.toString(),
    tenantId: loan.tenantId.toString(),
    bankAccountId: loan.bankAccountId.toString(),
    costCenterId: loan.costCenterId.toString(),
    name: loan.name,
    type: loan.type,
    contractNumber: loan.contractNumber,
    status: loan.status,
    principalAmount: loan.principalAmount,
    outstandingBalance: loan.outstandingBalance,
    interestRate: loan.interestRate,
    interestType: loan.interestType,
    startDate: loan.startDate,
    endDate: loan.endDate,
    totalInstallments: loan.totalInstallments,
    paidInstallments: loan.paidInstallments,
    installmentDay: loan.installmentDay,
    notes: loan.notes,
    isActive: loan.isActive,
    isDefaulted: loan.isDefaulted,
    progressPercentage: loan.progressPercentage,
    remainingInstallments: loan.remainingInstallments,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
    deletedAt: loan.deletedAt,
  };
}
