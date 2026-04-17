import { MAX_POSSIBLE_SCORE } from '@/constants/finance/match-score';
import type { BankReconciliationItem } from '@/entities/finance/bank-reconciliation-item';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import { calculateMatchScore } from '@/services/finance/match-scorer';

const AUTO_MATCH_THRESHOLD = 70;

interface MatchCandidate {
  itemId: string;
  entryId: string;
  score: number;
}

// Re-export for backward compatibility with tests and external callers that
// previously imported from this file.
export { calculateMatchScore };

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
