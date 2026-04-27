/**
 * Phase 9 / Plan 09-02 — Get audit detail for a single TimeEntry.
 * Returns full row + prevTimeEntry + signals + map data.
 */

export interface GetAuditDetailUseCase {
  execute(req: { tenantId: string; id: string }): Promise<{
    row: {
      id: string;
      employeeId: string;
      employeeName: string;
      timestamp: Date;
      entryType: string;
      latitude?: number;
      longitude?: number;
      accuracy?: number;
      ipAddress?: string;
      metadata: Record<string, unknown> | null;
      signals: Array<{
        kind: string;
        value: unknown;
        severity: 'low' | 'medium' | 'high';
      }>;
      score: number;
    };
    prevTimeEntry?: {
      timestamp: Date;
      latitude?: number;
      longitude?: number;
    };
    allSignals: Array<{ kind: string; value: unknown; severity: string }>;
  }>;
}
