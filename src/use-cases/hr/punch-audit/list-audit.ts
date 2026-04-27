/**
 * Phase 9 / Plan 09-02 — List punch audit rows with filtering.
 *
 * Composite scoring based on signals: FACE_MATCH_FAIL_3X=25, OUT_OF_GEOFENCE=15,
 * GPS_INCONSISTENT=20, suspectMock=20, drift>120=30, drift 30-119=10,
 * fingerprint divergence=10. Score ∈ [0, 100].
 *
 * Cursor pagination Phase 7 pattern. Hard limit 100 (DoS mitigation).
 */

export interface ListAuditUseCase {
  execute(req: {
    tenantId: string;
    filters?: {
      faceMatch?: {
        includeLow?: boolean;
        includeFail3x?: boolean;
        minScore?: number;
      };
      gps?: {
        outOfGeofence?: boolean;
        gpsInconsistent?: boolean;
        accuracyAbove100?: boolean;
        velocityAnomaly?: boolean;
        suspectMock?: boolean;
      };
      drift?: { minDriftSec?: number };
      fingerprint?: { minUniqueCount?: number; periodDays?: number };
      dateRange?: { from: Date; to: Date };
    };
    matchMode?: 'or' | 'and';
    cursor?: string;
    limit?: number;
  }): Promise<{
    items: Array<{
      id: string;
      type: 'TimeEntry' | 'PunchApproval';
      employeeId: string;
      employeeName: string;
      matricula?: string;
      timestamp: Date;
      entryType?: string;
      origin?: string;
      signals: Array<{
        kind: string;
        value: unknown;
        severity: 'low' | 'medium' | 'high';
      }>;
      score: number;
    }>;
    meta: { total: number; nextCursor?: string };
  }>;
}
