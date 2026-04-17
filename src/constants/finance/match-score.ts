/**
 * Maximum possible match score used to normalize reconciliation match confidence
 * into a [0..1] range.
 *
 * Derived from the sum of the maximum reachable score in
 * {@link calculateMatchScore}:
 *   - Amount exact match:    +40
 *   - Date exact match:      +25
 *   - Description (>=0.8):   +25
 *   - Supplier bonus:        +10
 *   - Type match:            +10
 *   = 110
 */
export const MAX_POSSIBLE_SCORE = 110;
