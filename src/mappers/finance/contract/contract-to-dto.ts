import type { Contract } from '@/entities/finance/contract';

export interface ContractDTO {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  description?: string;
  status: string;
  companyId?: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  totalValue: number;
  paymentFrequency: string;
  paymentAmount: number;
  categoryId?: string;
  costCenterId?: string;
  bankAccountId?: string;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  renewalPeriodMonths?: number;
  alertDaysBefore: number;
  folderPath?: string;
  notes?: string;
  isActive: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  daysUntilExpiration: number;
  createdBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function contractToDTO(contract: Contract): ContractDTO {
  return {
    id: contract.id.toString(),
    tenantId: contract.tenantId.toString(),
    code: contract.code,
    title: contract.title,
    description: contract.description,
    status: contract.status,
    companyId: contract.companyId,
    companyName: contract.companyName,
    contactName: contract.contactName,
    contactEmail: contract.contactEmail,
    totalValue: contract.totalValue,
    paymentFrequency: contract.paymentFrequency,
    paymentAmount: contract.paymentAmount,
    categoryId: contract.categoryId,
    costCenterId: contract.costCenterId,
    bankAccountId: contract.bankAccountId,
    startDate: contract.startDate,
    endDate: contract.endDate,
    autoRenew: contract.autoRenew,
    renewalPeriodMonths: contract.renewalPeriodMonths,
    alertDaysBefore: contract.alertDaysBefore,
    folderPath: contract.folderPath,
    notes: contract.notes,
    isActive: contract.isActive,
    isCancelled: contract.isCancelled,
    isExpired: contract.isExpired,
    daysUntilExpiration: contract.daysUntilExpiration,
    createdBy: contract.createdBy,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    deletedAt: contract.deletedAt,
  };
}
