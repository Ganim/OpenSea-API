import type { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import type { FinanceEntry } from '@/entities/finance/finance-entry';

const SCORE_AMOUNT_EXACT_MATCH = 40;
const SCORE_DATE_WITHIN_1_DAY = 40;
const SCORE_DATE_WITHIN_3_DAYS = 30;
const SCORE_DESCRIPTION_MATCH = 20;
const SCORE_TYPE_MATCH = 10;
const AUTO_MATCH_THRESHOLD = 70;

interface MatchCandidate {
  itemId: string;
  entryId: string;
  score: number;
}

/**
 * Calculates the match score between a bank transaction item and a finance entry.
 * Scoring criteria:
 *   - Amount exact match: +40
 *   - Date within 1 day: +40, within 3 days: +30
 *   - Description similarity (contains supplier/customer name): +20
 *   - Type match (DEBIT=PAYABLE, CREDIT=RECEIVABLE): +10
 */
function calculateMatchScore(
  item: BankReconciliationItem,
  entry: FinanceEntry,
): number {
  let score = 0;

  // Amount exact match (compare to 2 decimal places)
  const itemAmount = Math.round(item.amount * 100);
  const entryAmount = Math.round(entry.expectedAmount * 100);

  if (itemAmount === entryAmount) {
    score += SCORE_AMOUNT_EXACT_MATCH;
  }

  // Date proximity
  const daysDifference = Math.abs(
    (item.transactionDate.getTime() - entry.dueDate.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (daysDifference <= 1) {
    score += SCORE_DATE_WITHIN_1_DAY;
  } else if (daysDifference <= 3) {
    score += SCORE_DATE_WITHIN_3_DAYS;
  }

  // Description similarity
  const itemDescLower = item.description.toLowerCase();
  const supplierName = entry.supplierName?.toLowerCase() ?? '';
  const customerName = entry.customerName?.toLowerCase() ?? '';
  const entryDescription = entry.description.toLowerCase();

  if (
    (supplierName && itemDescLower.includes(supplierName)) ||
    (customerName && itemDescLower.includes(customerName)) ||
    itemDescLower.includes(entryDescription) ||
    entryDescription.includes(itemDescLower)
  ) {
    score += SCORE_DESCRIPTION_MATCH;
  }

  // Type match: DEBIT -> PAYABLE, CREDIT -> RECEIVABLE
  const typeMatches =
    (item.type === 'DEBIT' && entry.type === 'PAYABLE') ||
    (item.type === 'CREDIT' && entry.type === 'RECEIVABLE');

  if (typeMatches) {
    score += SCORE_TYPE_MATCH;
  }

  return score;
}

/**
 * Runs the auto-matching algorithm between bank transaction items and finance entries.
 * Uses a greedy approach: sorts candidates by score descending, then assigns
 * one-to-one matches (each entry can match at most one transaction item).
 *
 * @returns Map of item ID to { entryId, confidence }
 */
export function autoMatchTransactions(
  items: BankReconciliationItem[],
  entries: FinanceEntry[],
): Map<string, { entryId: string; confidence: number }> {
  const candidates: MatchCandidate[] = [];

  // Calculate scores for all possible pairs
  for (const item of items) {
    for (const entry of entries) {
      const score = calculateMatchScore(item, entry);

      if (score >= AUTO_MATCH_THRESHOLD) {
        candidates.push({
          itemId: item.id.toString(),
          entryId: entry.id.toString(),
          score,
        });
      }
    }
  }

  // Sort by score descending (best matches first)
  candidates.sort((a, b) => b.score - a.score);

  // Greedy one-to-one assignment
  const matchedItemIds = new Set<string>();
  const matchedEntryIds = new Set<string>();
  const matchResults = new Map<
    string,
    { entryId: string; confidence: number }
  >();

  for (const candidate of candidates) {
    if (
      matchedItemIds.has(candidate.itemId) ||
      matchedEntryIds.has(candidate.entryId)
    ) {
      continue;
    }

    matchedItemIds.add(candidate.itemId);
    matchedEntryIds.add(candidate.entryId);

    // Normalize score to 0.0 - 1.0 confidence
    const maxPossibleScore =
      SCORE_AMOUNT_EXACT_MATCH +
      SCORE_DATE_WITHIN_1_DAY +
      SCORE_DESCRIPTION_MATCH +
      SCORE_TYPE_MATCH;

    matchResults.set(candidate.itemId, {
      entryId: candidate.entryId,
      confidence: candidate.score / maxPossibleScore,
    });
  }

  return matchResults;
}
