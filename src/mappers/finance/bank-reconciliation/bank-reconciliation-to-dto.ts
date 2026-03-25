import type { BankReconciliation } from '@/entities/finance/bank-reconciliation';
import type { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';

export interface BankReconciliationItemDTO {
  id: string;
  reconciliationId: string;
  fitId: string;
  transactionDate: Date;
  amount: number;
  description: string;
  type: string;
  matchedEntryId?: string;
  matchConfidence?: number;
  matchStatus: string;
  createdAt: Date;
}

export interface BankReconciliationDTO {
  id: string;
  bankAccountId: string;
  importDate: Date;
  fileName: string;
  periodStart: Date;
  periodEnd: Date;
  totalTransactions: number;
  matchedCount: number;
  unmatchedCount: number;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  items?: BankReconciliationItemDTO[];
}

export function bankReconciliationItemToDTO(
  item: BankReconciliationItem,
): BankReconciliationItemDTO {
  return {
    id: item.id.toString(),
    reconciliationId: item.reconciliationId.toString(),
    fitId: item.fitId,
    transactionDate: item.transactionDate,
    amount: item.amount,
    description: item.description,
    type: item.type,
    matchedEntryId: item.matchedEntryId?.toString(),
    matchConfidence: item.matchConfidence,
    matchStatus: item.matchStatus,
    createdAt: item.createdAt,
  };
}

export function bankReconciliationToDTO(
  reconciliation: BankReconciliation,
): BankReconciliationDTO {
  return {
    id: reconciliation.id.toString(),
    bankAccountId: reconciliation.bankAccountId.toString(),
    importDate: reconciliation.importDate,
    fileName: reconciliation.fileName,
    periodStart: reconciliation.periodStart,
    periodEnd: reconciliation.periodEnd,
    totalTransactions: reconciliation.totalTransactions,
    matchedCount: reconciliation.matchedCount,
    unmatchedCount: reconciliation.unmatchedCount,
    status: reconciliation.status,
    createdAt: reconciliation.createdAt,
    updatedAt: reconciliation.updatedAt,
    items: reconciliation.items?.map(bankReconciliationItemToDTO),
  };
}
