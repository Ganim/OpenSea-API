import type { BidContract } from '@/entities/sales/bid-contract';

export interface BidContractDTO {
  id: string;
  tenantId: string;
  bidId: string;
  contractNumber: string;
  status: string;
  signedDate: Date | null;
  startDate: Date;
  endDate: Date;
  totalValue: number;
  remainingValue: number;
  customerId: string;
  renewalCount: number;
  maxRenewals: number | null;
  renewalDeadline: Date | null;
  deliveryAddresses: Record<string, unknown> | null;
  contractFileId: string | null;
  notes: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function bidContractToDTO(contract: BidContract): BidContractDTO {
  return {
    id: contract.id.toString(),
    tenantId: contract.tenantId.toString(),
    bidId: contract.bidId.toString(),
    contractNumber: contract.contractNumber,
    status: contract.status,
    signedDate: contract.signedDate ?? null,
    startDate: contract.startDate,
    endDate: contract.endDate,
    totalValue: contract.totalValue,
    remainingValue: contract.remainingValue,
    customerId: contract.customerId.toString(),
    renewalCount: contract.renewalCount,
    maxRenewals: contract.maxRenewals ?? null,
    renewalDeadline: contract.renewalDeadline ?? null,
    deliveryAddresses: contract.deliveryAddresses ?? null,
    contractFileId: contract.contractFileId?.toString() ?? null,
    notes: contract.notes ?? null,
    deletedAt: contract.deletedAt ?? null,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt ?? null,
  };
}
