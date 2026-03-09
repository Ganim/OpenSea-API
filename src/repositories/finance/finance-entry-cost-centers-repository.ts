import type { FinanceEntryCostCenter } from '@/entities/finance/finance-entry-cost-center';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateFinanceEntryCostCenterItem {
  entryId: string;
  costCenterId: string;
  percentage: number;
  amount: number;
}

export interface FinanceEntryCostCentersRepository {
  createMany(
    data: CreateFinanceEntryCostCenterItem[],
    tx?: TransactionClient,
  ): Promise<void>;
  findByEntryId(entryId: string): Promise<FinanceEntryCostCenter[]>;
  deleteByEntryId(entryId: string, tx?: TransactionClient): Promise<void>;
}
