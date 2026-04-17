import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankReconciliation } from '@/entities/finance/bank-reconciliation';
import type { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateBankReconciliationSchema {
  tenantId: string;
  bankAccountId: string;
  fileName: string;
  periodStart: Date;
  periodEnd: Date;
  totalTransactions: number;
  matchedCount?: number;
  unmatchedCount?: number;
  status?: string;
}

export interface CreateBankReconciliationItemSchema {
  reconciliationId: string;
  fitId: string;
  transactionDate: Date;
  amount: number;
  description: string;
  type: string;
  matchedEntryId?: string;
  matchConfidence?: number;
  matchStatus?: string;
}

export interface UpdateBankReconciliationSchema {
  id: UniqueEntityID;
  tenantId: string;
  matchedCount?: number;
  unmatchedCount?: number;
  status?: string;
}

export interface UpdateBankReconciliationItemSchema {
  id: UniqueEntityID;
  tenantId: string;
  matchedEntryId?: string | null;
  matchConfidence?: number | null;
  matchStatus?: string;
}

export interface FindManyReconciliationsOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  bankAccountId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface FindManyReconciliationsResult {
  reconciliations: BankReconciliation[];
  total: number;
}

export interface BankReconciliationsRepository {
  create(
    data: CreateBankReconciliationSchema,
    tx?: TransactionClient,
  ): Promise<BankReconciliation>;

  createItems(
    items: CreateBankReconciliationItemSchema[],
    tx?: TransactionClient,
  ): Promise<BankReconciliationItem[]>;

  findById(
    id: UniqueEntityID,
    tenantId: string,
    includeItems?: boolean,
  ): Promise<BankReconciliation | null>;

  findMany(
    options: FindManyReconciliationsOptions,
  ): Promise<FindManyReconciliationsResult>;

  findItemById(
    itemId: UniqueEntityID,
    reconciliationId: string,
  ): Promise<BankReconciliationItem | null>;

  update(
    data: UpdateBankReconciliationSchema,
    tx?: TransactionClient,
  ): Promise<BankReconciliation | null>;

  updateItem(
    data: UpdateBankReconciliationItemSchema,
    tx?: TransactionClient,
  ): Promise<BankReconciliationItem | null>;
}
