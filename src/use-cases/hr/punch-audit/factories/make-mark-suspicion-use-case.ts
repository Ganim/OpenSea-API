import { MarkSuspicionUseCaseImpl } from '../mark-suspicion-impl';

/**
 * Phase 9 / Plan 09-02 — Factory for MarkSuspicionUseCase.
 * Creates idempotent audit log entries.
 */
export function makeMarkSuspicionUseCase() {
  return new MarkSuspicionUseCaseImpl();
}
