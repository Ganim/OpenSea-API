import type { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import {
  calculateStringSimilarity,
  normalizeString,
} from '@/utils/string-similarity';

/**
 * Shared match scoring logic used by {@link autoMatchTransactions} (simple
 * greedy matcher) and {@link AutoReconcileUseCase} (matcher with human review
 * suggestions).
 *
 * Both entry points need identical scoring weights and short-circuit rules
 * (amount-gate aborts with score=0), so the scoring is factored into a single
 * pure function. The version that tracks reasons wraps this one so callers who
 * need `matchReasons[]` can still get them without duplicating logic.
 */

export const SCORE_AMOUNT_EXACT = 40;
export const SCORE_AMOUNT_WITHIN_TOLERANCE = 30;
export const SCORE_DATE_EXACT = 25;
export const SCORE_DATE_WITHIN_1_DAY = 20;
export const SCORE_DATE_WITHIN_3_DAYS = 15;
export const SCORE_DATE_WITHIN_7_DAYS = 5;
export const SCORE_DESCRIPTION_HIGH_SIMILARITY = 25;
export const SCORE_DESCRIPTION_MEDIUM_SIMILARITY = 15;
export const SCORE_DESCRIPTION_LOW_SIMILARITY = 5;
export const SCORE_SUPPLIER_NAME_EXACT_BONUS = 10;
export const SCORE_TYPE_MATCH = 10;

export type MatchReason =
  | 'AMOUNT_EXACT'
  | 'AMOUNT_WITHIN_TOLERANCE'
  | 'DATE_EXACT'
  | 'DATE_WITHIN_1_DAY'
  | 'DATE_WITHIN_3_DAYS'
  | 'DATE_WITHIN_7_DAYS'
  | 'DESCRIPTION_HIGH_SIMILARITY'
  | 'DESCRIPTION_MEDIUM_SIMILARITY'
  | 'DESCRIPTION_LOW_SIMILARITY'
  | 'NAME_MATCH'
  | 'TYPE_MATCH';

export interface MatchScoreResult {
  score: number;
  matchReasons: MatchReason[];
}

/**
 * Calculates the match score between a bank transaction item and a finance
 * entry, together with the list of reasons that contributed to the score.
 *
 * Scoring breakdown:
 *   - Amount exact: +40 | within 1% tolerance: +30 | otherwise: 0 (short-circuits)
 *   - Date exact: +25 | <=1 day: +20 | <=3 days: +15 | <=7 days: +5
 *   - Description similarity (Levenshtein): >=0.8: +25 | >=0.6: +15 | >=0.4: +5
 *   - Supplier/customer name found in description: +10 (bonus)
 *   - Type match (DEBIT=PAYABLE, CREDIT=RECEIVABLE): +10
 */
export function calculateMatchScoreWithReasons(
  item: BankReconciliationItem,
  entry: FinanceEntry,
): MatchScoreResult {
  let score = 0;
  const matchReasons: MatchReason[] = [];

  // ---- Amount matching (most important — gate) ----
  const itemAmountCents = Math.round(item.amount * 100);
  const entryAmountCents = Math.round(entry.expectedAmount * 100);
  const amountDifferenceCents = Math.abs(itemAmountCents - entryAmountCents);
  const amountToleranceCents = Math.max(
    Math.round(entry.expectedAmount * 0.01 * 100), // 1% of expected
    100, // minimum R$1.00
  );

  if (amountDifferenceCents === 0) {
    score += SCORE_AMOUNT_EXACT;
    matchReasons.push('AMOUNT_EXACT');
  } else if (amountDifferenceCents <= amountToleranceCents) {
    score += SCORE_AMOUNT_WITHIN_TOLERANCE;
    matchReasons.push('AMOUNT_WITHIN_TOLERANCE');
  } else {
    // Amount too far off — no match possible
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

  // ---- Description similarity (Levenshtein-based fuzzy matching) ----
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

  // ---- Type match: DEBIT -> PAYABLE, CREDIT -> RECEIVABLE ----
  const typeMatches =
    (item.type === 'DEBIT' && entry.type === 'PAYABLE') ||
    (item.type === 'CREDIT' && entry.type === 'RECEIVABLE');

  if (typeMatches) {
    score += SCORE_TYPE_MATCH;
    matchReasons.push('TYPE_MATCH');
  }

  return { score, matchReasons };
}

/**
 * Convenience wrapper for callers that only need the numeric score.
 */
export function calculateMatchScore(
  item: BankReconciliationItem,
  entry: FinanceEntry,
): number {
  return calculateMatchScoreWithReasons(item, entry).score;
}
