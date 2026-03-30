/**
 * Normalizes a string for comparison by removing accents, special characters,
 * and extra whitespace.
 */
export function normalizeString(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks (accents)
    .replace(/[^a-z0-9\s]/g, '') // Remove non-alphanumeric except spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates the Levenshtein edit distance between two strings.
 * This represents the minimum number of single-character edits
 * (insertions, deletions, substitutions) needed to transform one string into the other.
 */
export function levenshteinDistance(source: string, target: string): number {
  const sourceLength = source.length;
  const targetLength = target.length;

  // Early exit for empty strings
  if (sourceLength === 0) return targetLength;
  if (targetLength === 0) return sourceLength;

  // Use two rows instead of full matrix for space efficiency
  let previousRow: number[] = Array.from(
    { length: targetLength + 1 },
    (_, j) => j,
  );
  let currentRow: number[] = new Array(targetLength + 1);

  for (let i = 1; i <= sourceLength; i++) {
    currentRow[0] = i;

    for (let j = 1; j <= targetLength; j++) {
      const substitutionCost = source[i - 1] === target[j - 1] ? 0 : 1;

      currentRow[j] = Math.min(
        previousRow[j] + 1, // deletion
        currentRow[j - 1] + 1, // insertion
        previousRow[j - 1] + substitutionCost, // substitution
      );
    }

    // Swap rows
    [previousRow, currentRow] = [currentRow, previousRow];
  }

  return previousRow[targetLength];
}

/**
 * Calculates the similarity between two strings using Levenshtein distance.
 * Returns a value between 0 (completely different) and 1 (identical).
 *
 * Strings are normalized before comparison (lowercase, no accents, no special chars).
 */
export function calculateStringSimilarity(
  normalizedA: string,
  normalizedB: string,
): number {
  if (!normalizedA || !normalizedB) return 0;

  const maxLength = Math.max(normalizedA.length, normalizedB.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(normalizedA, normalizedB);
  return 1 - distance / maxLength;
}
