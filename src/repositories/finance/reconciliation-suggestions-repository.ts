import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReconciliationSuggestion } from '@/entities/finance/reconciliation-suggestion';
import type { TransactionClient } from '@/lib/transaction-manager';

export interface CreateReconciliationSuggestionSchema {
  tenantId: string;
  transactionId: string;
  entryId: string;
  score: number;
  matchReasons: string[];
  status?: string;
}

export interface FindManySuggestionsOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  status?: string;
  reconciliationId?: string;
}

export interface FindManySuggestionsResult {
  suggestions: ReconciliationSuggestion[];
  total: number;
}

export interface ReconciliationSuggestionsRepository {
  create(
    data: CreateReconciliationSuggestionSchema,
    tx?: TransactionClient,
  ): Promise<ReconciliationSuggestion>;

  createMany(
    dataList: CreateReconciliationSuggestionSchema[],
    tx?: TransactionClient,
  ): Promise<number>;

  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ReconciliationSuggestion | null>;

  findMany(
    options: FindManySuggestionsOptions,
  ): Promise<FindManySuggestionsResult>;

  findByTransactionId(
    transactionId: string,
    tenantId: string,
  ): Promise<ReconciliationSuggestion[]>;

  updateStatus(
    id: UniqueEntityID,
    status: string,
    reviewedBy: string,
    tx?: TransactionClient,
  ): Promise<ReconciliationSuggestion | null>;

  deleteByTransactionId(
    transactionId: string,
    tx?: TransactionClient,
  ): Promise<void>;
}
