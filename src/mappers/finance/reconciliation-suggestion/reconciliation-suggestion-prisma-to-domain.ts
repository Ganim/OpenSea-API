import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ReconciliationSuggestion } from '@/entities/finance/reconciliation-suggestion';

export interface PrismaReconciliationSuggestion {
  id: string;
  tenantId: string;
  transactionId: string;
  entryId: string;
  score: number;
  matchReasons: string[];
  status: string;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
}

export function reconciliationSuggestionPrismaToDomain(
  data: PrismaReconciliationSuggestion,
): ReconciliationSuggestion {
  return ReconciliationSuggestion.create(
    {
      id: new UniqueEntityID(data.id),
      tenantId: new UniqueEntityID(data.tenantId),
      transactionId: new UniqueEntityID(data.transactionId),
      entryId: new UniqueEntityID(data.entryId),
      score: data.score,
      matchReasons: data.matchReasons,
      status: data.status as ReconciliationSuggestion['status'],
      reviewedAt: data.reviewedAt ?? undefined,
      reviewedBy: data.reviewedBy ?? undefined,
      createdAt: data.createdAt,
    },
    new UniqueEntityID(data.id),
  );
}
