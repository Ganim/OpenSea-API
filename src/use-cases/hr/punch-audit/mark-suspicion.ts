/**
 * Phase 9 / Plan 09-02 — Mark a time entry as suspicious (audit).
 * Creates audit log PUNCH_AUDIT_MARK_SUSPICION. Idempotent by (action, actor, entity).
 */

export interface MarkSuspicionUseCase {
  execute(req: {
    tenantId: string;
    timeEntryId: string;
    reason: string;
    markedByUserId: string;
  }): Promise<{
    markedAt: Date;
    auditLogId: string;
  }>;
}
