/**
 * Punch module event type definitions.
 *
 * Each event constant follows the `{module}.{entity}.{action}` naming convention.
 * Data interfaces define the typed payload for each event.
 *
 * Introduced by Plan 04-05 — replaces the temporary string literals used in
 * Plan 04-04's ExecutePunchUseCase. Aligns with SALES_EVENTS / FINANCE_EVENTS /
 * MESSAGING_EVENTS pattern.
 */

// ─── Event Type Constants ────────────────────────────────────────────────────

export const PUNCH_EVENTS = {
  TIME_ENTRY_CREATED: 'punch.time-entry.created',
  APPROVAL_REQUESTED: 'punch.approval.requested',
  APPROVAL_RESOLVED: 'punch.approval.resolved',
  DEVICE_PAIRED: 'punch.device.paired',
  DEVICE_REVOKED: 'punch.device.revoked',
} as const;

export type PunchEventType = (typeof PUNCH_EVENTS)[keyof typeof PUNCH_EVENTS];

// ─── Event Data Interfaces ───────────────────────────────────────────────────

export interface PunchTimeEntryCreatedData {
  timeEntryId: string;
  employeeId: string;
  entryType: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
  /** ISO 8601 timestamp of the punch. */
  timestamp: string;
  /** NSR sequential number (Portaria 671). `null` when the use case did not surface it. */
  nsrNumber: number | null;
  /** True when at least one PunchApproval was created for this entry. */
  hasApproval: boolean;
  /** ID of the device that produced the punch, or `null` when via JWT. */
  punchDeviceId: string | null;
}

export interface PunchApprovalRequestedData {
  approvalId: string;
  timeEntryId: string;
  employeeId: string;
  /**
   * Reason the batida needs manager review. Extensible — future phases add
   * FACE_MATCH_LOW (phase 5), CLOCK_DRIFT (phase 9), MANUAL_CORRECTION (phase 6),
   * FACE_MATCH_FAIL_3X (phase 9).
   */
  reason: 'OUT_OF_GEOFENCE';
  /** Payload specific to the reason (distance, zoneId, faceScore, ...). */
  details?: Record<string, unknown>;
}

export interface PunchApprovalResolvedData {
  approvalId: string;
  timeEntryId: string;
  employeeId: string;
  status: 'APPROVED' | 'REJECTED';
  resolverUserId: string;
  /** ISO 8601 timestamp when the approval was resolved. */
  resolvedAt: string;
}

export interface PunchDevicePairedData {
  deviceId: string;
  deviceName: string;
  deviceKind: string;
  pairedByUserId: string;
}

export interface PunchDeviceRevokedData {
  deviceId: string;
  deviceName: string;
  revokedByUserId: string;
  reason?: string;
}
