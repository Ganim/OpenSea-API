/**
 * Phase 9 / Plan 09-02 — Get top devices by clock drift in period.
 * Uses Prisma $queryRaw to aggregate metadata.clockDriftSec.
 */

export interface GetDriftRankingUseCase {
  execute(req: {
    tenantId: string;
    periodDays?: number;
    limit?: number;
  }): Promise<
    Array<{
      deviceId: string;
      deviceName: string;
      avgDriftSec: number;
      count: number;
    }>
  >;
}
