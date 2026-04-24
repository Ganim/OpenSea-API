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
  // Phase 5 additions (kiosk + QR + face match)
  PIN_LOCKED: 'punch.pin.locked',
  QR_ROTATED: 'punch.qr.rotated',
  QR_ROTATION_COMPLETED: 'punch.qr.rotation.completed',
  FACE_MATCH_FAILED: 'punch.face_match.failed',
  // Phase 7 additions (Plan 07-01 — Dashboard Gestor)
  MISSED_PUNCHES_DETECTED: 'punch.missed-punches.detected',
  DEVICE_STATUS_CHANGED: 'punch.device.status-changed',
  DAILY_DIGEST_SENT: 'punch.daily-digest.sent',
  EXCEPTION_APPROVAL_REQUESTED: 'punch.exception.approval-requested',
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
   * Reason the batida needs manager review. Phase 5 adds `FACE_MATCH_LOW`
   * (Plan 05-07 / D-03). Future phases: CLOCK_DRIFT (phase 9),
   * MANUAL_CORRECTION (phase 6), FACE_MATCH_FAIL_3X (phase 9).
   */
  reason: 'OUT_OF_GEOFENCE' | 'FACE_MATCH_LOW';
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

// ─── Phase 5 Event Data Interfaces ───────────────────────────────────────────

/**
 * Emitted when an employee's PIN of ponto is locked after 5 consecutive
 * failed attempts (D-11). Triggers `punch.pin_locked` notification to all
 * users with `hr.punch-devices.admin` permission so they can intervene.
 *
 * Body intentionally omits the PIN value and per-attempt details (T-PIN-02:
 * information-disclosure mitigation — do not aid offline brute-force).
 */
export interface PunchPinLockedData {
  employeeId: string;
  tenantId: string;
  employeeName: string;
  /** ISO 8601 timestamp until which the PIN is locked. */
  lockedUntil: string;
  /** How many consecutive failed attempts triggered the lockout. */
  failedAttempts: number;
}

/**
 * Emitted by the individual QR rotation use case (D-14 single rotation).
 * Audit-friendly trail of who rotated whose QR token and when. Does NOT
 * trigger a notification by itself (D-14 individual flow is sync; the admin
 * already saw the result inline).
 */
export interface PunchQrRotatedData {
  employeeId: string;
  tenantId: string;
  rotatedByUserId: string;
  /** ISO 8601 timestamp of the rotation. */
  rotatedAt: string;
}

/**
 * Emitted by the bulk QR rotation worker after all chunks finish (D-14 bulk
 * rotation, BullMQ job in `QUEUE_NAMES.QR_BATCH`). Triggers
 * `punch.qr_rotation.completed` notification to the invoking admin (and to
 * `hr.punch-devices.admin` broadcast when `processed > 50` — bulk-volume
 * gate to avoid noise on small rotations, T-QR-01 mitigation).
 */
export interface PunchQrRotationCompletedData {
  jobId: string;
  tenantId: string;
  invokedByUserId: string;
  processed: number;
  total: number;
  generatedPdfs: boolean;
  /** Pre-signed S3 URL of consolidated PDF, when `generatedPdfs === true`. */
  bulkPdfDownloadUrl: string | null;
}

/**
 * Emitted when a kiosk face-match call falls below the configured threshold
 * (D-01 / D-03). The TimeEntry is still recorded (D-12 always-write rule);
 * a PunchApproval row is created with reason FACE_MATCH_LOW for manager
 * review. This event lets future antifraude consumers (Phase 9) accumulate
 * statistics without blocking the kiosk flow.
 */
export interface PunchFaceMatchFailedData {
  timeEntryId: string;
  employeeId: string;
  tenantId: string;
  /** Min euclidean distance achieved across all enrollments (lower = closer). */
  distance: number;
  /** Threshold in effect at evaluation time (PunchConfiguration.faceMatchThreshold). */
  threshold: number;
  /** How many cadastrais embeddings the employee has registered. */
  enrollmentCount: number;
}

// ─── Phase 7 Event Data Interfaces (Plan 07-01 — Dashboard Gestor) ───────────

/**
 * Emitted by the scheduler `detect-missed-punches` (22h por tenant, timezone-aware)
 * quando o job finaliza a passagem por todos os funcionários ativos do tenant e
 * persiste os PunchMissedLog correspondentes (UNIQUE [tenantId, employeeId, date]).
 * Consumido pelo digest diário 18h (D-14) e pelo card "Faltantes do dia" da dashboard.
 */
export interface PunchMissedPunchesDetectedData {
  tenantId: string;
  /** Data de referência (YYYY-MM-DD) — coincide com PunchMissedLog.date. */
  date: string;
  /** Quantidade de PunchMissedLog criados nesta execução. */
  count: number;
  /** IDs dos PunchMissedLog criados (para downstream listagem/notificação). */
  logIds: string[];
}

/**
 * Emitted pelo heartbeat scheduler (1min) ao detectar transição ONLINE↔OFFLINE
 * de um PunchDevice (threshold 3min sem heartbeat = OFFLINE). Propagado via
 * Socket.IO `tenant:{id}:hr:devices:status-change` para atualizar a dashboard
 * de saúde dos dispositivos em tempo real.
 */
export interface PunchDeviceStatusChangedData {
  tenantId: string;
  deviceId: string;
  previousStatus: 'ONLINE' | 'OFFLINE';
  nextStatus: 'ONLINE' | 'OFFLINE';
  /** ISO 8601 timestamp da transição. */
  changedAt: string;
}

/**
 * Emitted pelo scheduler de digest 18h após o dispatch da notification
 * `punch.daily_digest` para um gestor/admin. Permite downstream consumers
 * (ex.: analytics) registrar quantos digests foram entregues por tenant/dia.
 */
export interface PunchDailyDigestSentData {
  tenantId: string;
  recipientUserId: string;
  /** Data de referência (YYYY-MM-DD) do digest. */
  date: string;
  pendingCount: number;
  approvedCount: number;
  missingCount: number;
}

/**
 * Emitted quando gestor solicita ao funcionário que justifique uma exceção de
 * ponto (PUNCH-NOTIF-03). Dispara a notification `punch.exception_approval_requested`
 * ACTIONABLE com botões embutidos. O fluxo completo do funcionário justificando
 * fica para Phase 8 (PWA pessoal); Phase 7 apenas envia o convite.
 */
export interface PunchExceptionApprovalRequestedData {
  tenantId: string;
  approvalId: string;
  employeeId: string;
  /** userId do gestor que solicitou a justificativa. */
  requestedBy: string;
  /** ISO 8601 — prazo opcional para o funcionário responder. */
  deadline?: string;
}
