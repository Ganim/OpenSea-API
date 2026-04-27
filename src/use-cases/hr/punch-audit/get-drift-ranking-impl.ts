/**
 * Phase 9 / Plan 09-02 — GetDriftRankingUseCase implementation.
 * Aggregates TimeEntry metadata.clockDriftSec to rank by device.
 */

import { prisma } from '@/lib/prisma';
import type { GetDriftRankingUseCase } from './get-drift-ranking';

export class GetDriftRankingUseCaseImpl implements GetDriftRankingUseCase {
  async execute(req: Parameters<GetDriftRankingUseCase['execute']>[0]) {
    const { tenantId, limit = 10, minDriftSec = 30 } = req;

    // Raw query to aggregate metadata.clockDriftSec by deviceFingerprint
    const results = await prisma.$queryRaw<
      Array<{
        device_fingerprint: string;
        avg_drift: number;
        max_drift: number;
        occurrence_count: number;
      }>
    >`
      SELECT
        device_fingerprint,
        AVG(CAST(metadata->>'clockDriftSec' AS NUMERIC)) AS avg_drift,
        MAX(CAST(metadata->>'clockDriftSec' AS NUMERIC)) AS max_drift,
        COUNT(*) AS occurrence_count
      FROM "TimeEntry"
      WHERE tenant_id = ${tenantId}
        AND metadata->>'clockDriftSec' IS NOT NULL
        AND CAST(metadata->>'clockDriftSec' AS NUMERIC) >= ${minDriftSec}
      GROUP BY device_fingerprint
      ORDER BY avg_drift DESC, max_drift DESC
      LIMIT ${Math.min(limit, 100)}
    `;

    return results.map((row) => ({
      deviceFingerprint: row.device_fingerprint,
      averageDriftSec: Math.round(Number(row.avg_drift) * 100) / 100,
      maxDriftSec: Math.round(Number(row.max_drift) * 100) / 100,
      occurrenceCount: Number(row.occurrence_count),
    }));
  }
}
