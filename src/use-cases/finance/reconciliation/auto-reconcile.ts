import { ErrorCodes } from '@/@errors/error-codes';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { ReconciliationSuggestionsRepository } from '@/repositories/finance/reconciliation-suggestions-repository';
import {
  calculateStringSimilarity,
  normalizeString,
} from '@/utils/string-similarity';

const SCORE_AMOUNT_EXACT = 40;
const SCORE_AMOUNT_WITHIN_TOLERANCE = 30;
const SCORE_DATE_EXACT = 25;
const SCORE_DATE_WITHIN_1_DAY = 20;
const SCORE_DATE_WITHIN_3_DAYS = 15;
const SCORE_DATE_WITHIN_7_DAYS = 5;
const SCORE_DESCRIPTION_HIGH_SIMILARITY = 25;
const SCORE_DESCRIPTION_MEDIUM_SIMILARITY = 15;
const SCORE_DESCRIPTION_LOW_SIMILARITY = 5;
const SCORE_SUPPLIER_NAME_EXACT_BONUS = 10;
const SCORE_TYPE_MATCH = 10;

const MAX_POSSIBLE_SCORE =
  SCORE_AMOUNT_EXACT +
  SCORE_DATE_EXACT +
  SCORE_DESCRIPTION_HIGH_SIMILARITY +
  SCORE_SUPPLIER_NAME_EXACT_BONUS +
  SCORE_TYPE_MATCH;

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
  matchReasons: string[];
}

/**
 * Calculates match score with detailed reasons for each matching criterion.
 *
 * Scoring breakdown:
 *   - Amount exact: +40 | within 1%: +30 | otherwise: 0 (skip)
 *   - Date exact: +25 | <=1 day: +20 | <=3 days: +15 | <=7 days: +5
 *   - Description similarity (Levenshtein): >=0.8: +25 | >=0.6: +15 | >=0.4: +5
 *   - Supplier/customer name in description: +10 (bonus)
 *   - Type match (DEBIT=PAYABLE, CREDIT=RECEIVABLE): +10
 */
function calculateMatchScoreWithReasons(
  item: BankReconciliationItem,
  entry: FinanceEntry,
): { score: number; matchReasons: string[] } {
  let score = 0;
  const matchReasons: string[] = [];

  // ---- Amount matching (gate) ----
  const itemAmountCents = Math.round(item.amount * 100);
  const entryAmountCents = Math.round(entry.expectedAmount * 100);
  const amountDifferenceCents = Math.abs(itemAmountCents - entryAmountCents);
  const amountToleranceCents = Math.max(
    Math.round(entry.expectedAmount * 0.01 * 100),
    100,
  );

  if (amountDifferenceCents === 0) {
    score += SCORE_AMOUNT_EXACT;
    matchReasons.push('AMOUNT_EXACT');
  } else if (amountDifferenceCents <= amountToleranceCents) {
    score += SCORE_AMOUNT_WITHIN_TOLERANCE;
    matchReasons.push('AMOUNT_WITHIN_TOLERANCE');
  } else {
    return { score: 0, matchReasons: [] };
  }

  // ---- Date proximity ----
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const daysDifference = Math.abs(
    Math.round(
      (item.transactionDate.getTime() - entry.dueDate.getTime()) /
        millisecondsPerDay,
    ),
  );

  if (daysDifference === 0) {
    score += SCORE_DATE_EXACT;
    matchReasons.push('DATE_EXACT');
  } else if (daysDifference <= 1) {
    score += SCORE_DATE_WITHIN_1_DAY;
    matchReasons.push('DATE_WITHIN_1_DAY');
  } else if (daysDifference <= 3) {
    score += SCORE_DATE_WITHIN_3_DAYS;
    matchReasons.push('DATE_WITHIN_3_DAYS');
  } else if (daysDifference <= 7) {
    score += SCORE_DATE_WITHIN_7_DAYS;
    matchReasons.push('DATE_WITHIN_7_DAYS');
  }

  // ---- Description similarity (Levenshtein fuzzy matching) ----
  const normalizedItemDescription = normalizeString(item.description);
  const entryComparisonText = entry.supplierName || entry.description;
  const normalizedEntryDescription = normalizeString(entryComparisonText);

  const descriptionSimilarity = calculateStringSimilarity(
    normalizedItemDescription,
    normalizedEntryDescription,
  );

  if (descriptionSimilarity >= 0.8) {
    score += SCORE_DESCRIPTION_HIGH_SIMILARITY;
    matchReasons.push('DESCRIPTION_HIGH_SIMILARITY');
  } else if (descriptionSimilarity >= 0.6) {
    score += SCORE_DESCRIPTION_MEDIUM_SIMILARITY;
    matchReasons.push('DESCRIPTION_MEDIUM_SIMILARITY');
  } else if (descriptionSimilarity >= 0.4) {
    score += SCORE_DESCRIPTION_LOW_SIMILARITY;
    matchReasons.push('DESCRIPTION_LOW_SIMILARITY');
  }

  // ---- Supplier/customer name exact match bonus ----
  const supplierNameLower = entry.supplierName?.toLowerCase() ?? '';
  const customerNameLower = entry.customerName?.toLowerCase() ?? '';
  const itemDescLower = item.description.toLowerCase();

  if (
    (supplierNameLower && itemDescLower.includes(supplierNameLower)) ||
    (customerNameLower && itemDescLower.includes(customerNameLower))
  ) {
    score += SCORE_SUPPLIER_NAME_EXACT_BONUS;
    matchReasons.push('NAME_MATCH');
  }

  // ---- Type match ----
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
