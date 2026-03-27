import type { ReconciliationSuggestion } from '@/entities/finance/reconciliation-suggestion';

export interface ReconciliationSuggestionDTO {
  id: string;
  tenantId: string;
  transactionId: string;
  entryId: string;
  score: number;
  matchReasons: string[];
  status: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
  // Enriched fields (populated by use cases / presenters)
  transactionDescription?: string;
  transactionAmount?: number;
  transactionDate?: Date;
  transactionType?: string;
  entryDescription?: string;
  entryAmount?: number;
  entryDueDate?: Date;
  entryType?: string;
  supplierName?: string;
  customerName?: string;
}

export function reconciliationSuggestionToDTO(
  suggestion: ReconciliationSuggestion,
): ReconciliationSuggestionDTO {
  return {
    id: suggestion.id.toString(),
    tenantId: suggestion.tenantId.toString(),
    transactionId: suggestion.transactionId.toString(),
    entryId: suggestion.entryId.toString(),
    score: suggestion.score,
    matchReasons: suggestion.matchReasons,
    status: suggestion.status,
    reviewedAt: suggestion.reviewedAt,
    reviewedBy: suggestion.reviewedBy,
    createdAt: suggestion.createdAt,
  };
}
