import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { ReconciliationSuggestionsRepository } from '@/repositories/finance/reconciliation-suggestions-repository';

const SCORE_AMOUNT_EXACT_MATCH = 40;
const SCORE_DATE_WITHIN_1_DAY = 40;
const SCORE_DATE_WITHIN_3_DAYS = 30;
const SCORE_DESCRIPTION_MATCH = 20;
const SCORE_TYPE_MATCH = 10;

const AUTO_RECONCILE_THRESHOLD = 95;
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
  matchReasons: string[];
}

function calculateMatchScoreWithReasons(
  item: BankReconciliationItem,
  entry: FinanceEntry,
): { score: number; matchReasons: string[] } {
  let score = 0;
  const matchReasons: string[] = [];

  // Amount exact match (compare to 2 decimal places)
  const itemAmount = Math.round(item.amount * 100);
  const entryAmount = Math.round(entry.expectedAmount * 100);

  if (itemAmount === entryAmount) {
    score += SCORE_AMOUNT_EXACT_MATCH;
    matchReasons.push('AMOUNT_EXACT');
  }

  // Date proximity
  const daysDifference = Math.abs(
    (item.transactionDate.getTime() - entry.dueDate.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (daysDifference <= 1) {
    score += SCORE_DATE_WITHIN_1_DAY;
    matchReasons.push('DATE_WITHIN_1_DAY');
  } else if (daysDifference <= 3) {
    score += SCORE_DATE_WITHIN_3_DAYS;
    matchReasons.push('DATE_WITHIN_3_DAYS');
  }

  // Description similarity
  const itemDescLower = item.description.toLowerCase();
  const supplierName = entry.supplierName?.toLowerCase() ?? '';
  const customerName = entry.customerName?.toLowerCase() ?? '';
  const entryDescription = entry.description.toLowerCase();

  if (
    (supplierName && itemDescLower.includes(supplierName)) ||
    (customerName && itemDescLower.includes(customerName))
  ) {
    score += SCORE_DESCRIPTION_MATCH;
    matchReasons.push('NAME_MATCH');
  } else if (
    itemDescLower.includes(entryDescription) ||
    entryDescription.includes(itemDescLower)
  ) {
    score += SCORE_DESCRIPTION_MATCH;
    matchReasons.push('DESCRIPTION_MATCH');
  }

  // Type match: DEBIT -> PAYABLE, CREDIT -> RECEIVABLE
  const typeMatches =
    (item.type === 'DEBIT' && entry.type === 'PAYABLE') ||
    (item.type === 'CREDIT' && entry.type === 'RECEIVABLE');

  if (typeMatches) {
    score += SCORE_TYPE_MATCH;
    matchReasons.push('TYPE_MATCH');
  }

  return { score, matchReasons };
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

    // Fetch candidate entries (period +-3 days, same bank account)
    const periodStartBuffer = new Date(reconciliation.periodStart);
    periodStartBuffer.setDate(periodStartBuffer.getDate() - 3);
    const periodEndBuffer = new Date(reconciliation.periodEnd);
    periodEndBuffer.setDate(periodEndBuffer.getDate() + 3);

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
          matchedEntryId: match.entryId,
          matchConfidence: match.score / 110, // Normalize to 0-1
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
