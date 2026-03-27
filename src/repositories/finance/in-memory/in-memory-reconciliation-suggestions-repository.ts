import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ReconciliationSuggestion } from '@/entities/finance/reconciliation-suggestion';
import type {
  ReconciliationSuggestionsRepository,
  CreateReconciliationSuggestionSchema,
  FindManySuggestionsOptions,
  FindManySuggestionsResult,
} from '../reconciliation-suggestions-repository';

export class InMemoryReconciliationSuggestionsRepository
  implements ReconciliationSuggestionsRepository
{
  public suggestions: ReconciliationSuggestion[] = [];

  async create(
    data: CreateReconciliationSuggestionSchema,
  ): Promise<ReconciliationSuggestion> {
    const suggestion = ReconciliationSuggestion.create({
      tenantId: new UniqueEntityID(data.tenantId),
      transactionId: new UniqueEntityID(data.transactionId),
      entryId: new UniqueEntityID(data.entryId),
      score: data.score,
      matchReasons: data.matchReasons,
      status: (data.status as ReconciliationSuggestion['status']) ?? 'PENDING',
    });

    this.suggestions.push(suggestion);
    return suggestion;
  }

  async createMany(
    dataList: CreateReconciliationSuggestionSchema[],
  ): Promise<number> {
    for (const data of dataList) {
      await this.create(data);
    }
    return dataList.length;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ReconciliationSuggestion | null> {
    return (
      this.suggestions.find(
        (s) => s.id.equals(id) && s.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    options: FindManySuggestionsOptions,
  ): Promise<FindManySuggestionsResult> {
    let filtered = this.suggestions.filter(
      (s) => s.tenantId.toString() === options.tenantId,
    );

    if (options.status) {
      filtered = filtered.filter((s) => s.status === options.status);
    }

    // Note: reconciliationId filter requires joining through transaction,
    // which is beyond in-memory scope. Skipped for simplicity.

    const total = filtered.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const paged = filtered.slice(startIndex, startIndex + limit);

    return { suggestions: paged, total };
  }

  async findByTransactionId(
    transactionId: string,
    tenantId: string,
  ): Promise<ReconciliationSuggestion[]> {
    return this.suggestions.filter(
      (s) =>
        s.transactionId.toString() === transactionId &&
        s.tenantId.toString() === tenantId,
    );
  }

  async updateStatus(
    id: UniqueEntityID,
    status: string,
    reviewedBy: string,
  ): Promise<ReconciliationSuggestion | null> {
    const suggestion = this.suggestions.find((s) => s.id.equals(id));
    if (!suggestion) return null;

    if (status === 'ACCEPTED') {
      suggestion.accept(reviewedBy);
    } else if (status === 'REJECTED') {
      suggestion.reject(reviewedBy);
    }

    return suggestion;
  }

  async deleteByTransactionId(transactionId: string): Promise<void> {
    this.suggestions = this.suggestions.filter(
      (s) => s.transactionId.toString() !== transactionId,
    );
  }
}
