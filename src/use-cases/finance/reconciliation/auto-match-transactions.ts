import { MAX_POSSIBLE_SCORE } from '@/constants/finance/match-score';
import type { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
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

const AUTO_MATCH_THRESHOLD = 70;

interface MatchCandidate {
  itemId: string;
  entryId: string;
  score: number;
}

/**
 * Calculates the match score between a bank transaction item and a finance entry.
 *
 * Scoring breakdown:
 *   - Amount exact match: +40 | within 1% tolerance: +30 | otherwise: 0 (skip)
 *   - Date exact: +25 | <=1 day: +20 | <=3 days: +15 | <=7 days: +5
 *   - Description similarity (Levenshtein): >=0.8: +25 | >=0.6: +15 | >=0.4: +5
 *   - Supplier/customer name found in description: +10 (bonus)
 *   - Type match (DEBIT=PAYABLE, CREDIT=RECEIVABLE): +10
 */
export function calculateMatchScore(
  item: BankReconciliationItem,
  entry: FinanceEntry,
): number {
  let score = 0;

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
  } else if (amountDifferenceCents <= amountToleranceCents) {
    score += SCORE_AMOUNT_WITHIN_TOLERANCE;
  } else {
    // Amount too far off — no match possible
    return 0;
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
  } else if (daysDifference <= 1) {
    score += SCORE_DATE_WITHIN_1_DAY;
  } else if (daysDifference <= 3) {
    score += SCORE_DATE_WITHIN_3_DAYS;
  } else if (daysDifference <= 7) {
    score += SCORE_DATE_WITHIN_7_DAYS;
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
  } else if (descriptionSimilarity >= 0.6) {
    score += SCORE_DESCRIPTION_MEDIUM_SIMILARITY;
  } else if (descriptionSimilarity >= 0.4) {
    score += SCORE_DESCRIPTION_LOW_SIMILARITY;
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
  }

  // ---- Type match: DEBIT -> PAYABLE, CREDIT -> RECEIVABLE ----
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

    matchResults.set(candidate.itemId, {
      entryId: candidate.entryId,
      confidence: candidate.score / MAX_POSSIBLE_SCORE,
    });
  }

  return matchResults;
}
