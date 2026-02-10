import type { Consortium } from '@/entities/finance/consortium';

export interface ConsortiumDTO {
  id: string;
  tenantId: string;
  bankAccountId: string;
  costCenterId: string;
  name: string;
  administrator: string;
  groupNumber?: string;
  quotaNumber?: string;
  contractNumber?: string;
  status: string;
  creditValue: number;
  monthlyPayment: number;
  totalInstallments: number;
  paidInstallments: number;
  isContemplated: boolean;
  contemplatedAt?: Date;
  contemplationType?: string;
  startDate: Date;
  endDate?: Date;
  paymentDay?: number;
  notes?: string;
  progressPercentage: number;
  remainingInstallments: number;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function consortiumToDTO(consortium: Consortium): ConsortiumDTO {
  return {
    id: consortium.id.toString(),
    tenantId: consortium.tenantId.toString(),
    bankAccountId: consortium.bankAccountId.toString(),
    costCenterId: consortium.costCenterId.toString(),
    name: consortium.name,
    administrator: consortium.administrator,
    groupNumber: consortium.groupNumber,
    quotaNumber: consortium.quotaNumber,
    contractNumber: consortium.contractNumber,
    status: consortium.status,
    creditValue: consortium.creditValue,
    monthlyPayment: consortium.monthlyPayment,
    totalInstallments: consortium.totalInstallments,
    paidInstallments: consortium.paidInstallments,
    isContemplated: consortium.isContemplated,
    contemplatedAt: consortium.contemplatedAt,
    contemplationType: consortium.contemplationType,
    startDate: consortium.startDate,
    endDate: consortium.endDate,
    paymentDay: consortium.paymentDay,
    notes: consortium.notes,
    progressPercentage: consortium.progressPercentage,
    remainingInstallments: consortium.remainingInstallments,
    createdAt: consortium.createdAt,
    updatedAt: consortium.updatedAt,
    deletedAt: consortium.deletedAt,
  };
}
