import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { MAX_POSSIBLE_SCORE } from '@/constants/finance/match-score';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { ReconciliationSuggestionsRepository } from '@/repositories/finance/reconciliation-suggestions-repository';
import {
  calculateMatchScoreWithReasons,
  type MatchReason,
} from '@/services/finance/match-scorer';

const AUTO_RECONCILE_THRESHOLD = 90;
const SUGGESTION_THRESHOLD = 70;

interface AutoReconcileUseCaseRequest {
  tenantId: string;
  reconciliationId: string;
}

interface AutoReconcileUseCaseResponse {
  autoReconciled: number;
  suggestionsCreated: number;
  skipped: number;
}

interface ScoredMatch {
  itemId: string;
  entryId: string;
  score: number;
  matchReasons: MatchReason[];
}

export class AutoReconcileUseCase {
  constructor(
    private bankReconciliationsRepository: BankReconciliationsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private reconciliationSuggestionsRepository: ReconciliationSuggestionsRepository,
  ) {}

  async execute(
    request: AutoReconcileUseCaseRequest,
  ): Promise<AutoReconcileUseCaseResponse> {
    const { tenantId, reconciliationId } = request;

    // Find reconciliation with items
    const reconciliation = await this.bankReconciliationsRepository.findById(
      new UniqueEntityID(reconciliationId),
      tenantId,
      true,
    );

    if (!reconciliation) {
      throw new ResourceNotFoundError(
        'Reconciliation not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    // Get unmatched items only
    const unmatchedItems =
      reconciliation.items?.filter((item) => item.isUnmatched) ?? [];

    if (unmatchedItems.length === 0) {
      return { autoReconciled: 0, suggestionsCreated: 0, skipped: 0 };
    }

    // Fetch candidate entries (period +-7 days for broader matching window)
    const periodStartBuffer = new Date(reconciliation.periodStart);
    periodStartBuffer.setDate(periodStartBuffer.getDate() - 7);
    const periodEndBuffer = new Date(reconciliation.periodEnd);
    periodEndBuffer.setDate(periodEndBuffer.getDate() + 7);

    const { entries: candidateEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        bankAccountId: reconciliation.bankAccountId.toString(),
        dueDateFrom: periodStartBuffer,
        dueDateTo: periodEndBuffer,
        limit: 1000,
      });

    // Calculate all scores
    const allMatches: ScoredMatch[] = [];

    for (const item of unmatchedItems) {
      for (const entry of candidateEntries) {
        const { score, matchReasons } = calculateMatchScoreWithReasons(
          item,
          entry,
        );

        if (score >= SUGGESTION_THRESHOLD) {
          allMatches.push({
            itemId: item.id.toString(),
            entryId: entry.id.toString(),
            score,
            matchReasons,
          });
        }
      }
    }

    // Sort by score descending
    allMatches.sort((a, b) => b.score - a.score);

    // Greedy one-to-one assignment
    const assignedItemIds = new Set<string>();
    const assignedEntryIds = new Set<string>();

    let autoReconciled = 0;
    let suggestionsCreated = 0;

    const suggestionBatch: {
      tenantId: string;
      transactionId: string;
      entryId: string;
      score: number;
      matchReasons: string[];
    }[] = [];

    for (const match of allMatches) {
      if (
        assignedItemIds.has(match.itemId) ||
        assignedEntryIds.has(match.entryId)
      ) {
        continue;
      }

      assignedItemIds.add(match.itemId);
      assignedEntryIds.add(match.entryId);

      if (match.score >= AUTO_RECONCILE_THRESHOLD) {
        // Auto-reconcile: update item as AUTO_MATCHED
        await this.bankReconciliationsRepository.updateItem({
          id: new UniqueEntityID(match.itemId),
          tenantId,
          matchedEntryId: match.entryId,
          matchConfidence: match.score / MAX_POSSIBLE_SCORE,
          matchStatus: 'AUTO_MATCHED',
        });

        autoReconciled++;
      } else {
        // Create suggestion for human review
        suggestionBatch.push({
          tenantId,
          transactionId: match.itemId,
          entryId: match.entryId,
          score: match.score,
          matchReasons: match.matchReasons,
        });
      }
    }

    // Batch create suggestions
    if (suggestionBatch.length > 0) {
      await this.reconciliationSuggestionsRepository.createMany(
        suggestionBatch,
      );
      suggestionsCreated = suggestionBatch.length;
    }

    // Update reconciliation counts
    const skipped = unmatchedItems.length - autoReconciled - suggestionsCreated;

    const fullReconciliation =
      await this.bankReconciliationsRepository.findById(
        new UniqueEntityID(reconciliationId),
        tenantId,
        true,
      );

    if (fullReconciliation?.items) {
      const matchedCount = fullReconciliation.items.filter(
        (i) => i.isMatched || i.matchStatus === 'CREATED',
      ).length;
      const unmatchedCount = fullReconciliation.items.filter(
        (i) => i.isUnmatched,
      ).length;

      await this.bankReconciliationsRepository.update({
        id: new UniqueEntityID(reconciliationId),
        tenantId,
        matchedCount,
        unmatchedCount,
      });
    }

    return { autoReconciled, suggestionsCreated, skipped };
  }
}
