import { GetDriftRankingUseCaseImpl } from '../get-drift-ranking-impl';

/**
 * Phase 9 / Plan 09-02 — Factory for GetDriftRankingUseCase.
 * Queries TimeEntry metadata for clock drift ranking.
 */
export function makeGetDriftRankingUseCase() {
  return new GetDriftRankingUseCaseImpl();
}
