/**
 * Webhook event allowlist — Phase 11 / Plan 11-01 / D-16.
 *
 * Lista hardcoded de exatamente 5 eventos punch.* que webhooks outbound
 * recebem em V1. NÃO usar Object.values do PUNCH_EVENTS — Pitfall 12 do
 * RESEARCH: PUNCH_EVENTS contém eventos de Phase 5/7/9 (PIN_LOCKED,
 * FACE_MATCH_FAIL_3X, GPS_INCONSISTENT, MISSED_PUNCH_DETECTED, etc.) que
 * NÃO devem ir para sistemas externos (vazariam sinais antifraude).
 *
 * Quando outros módulos (sales, finance) entrarem em V2, criar
 * SALES_WEBHOOK_EVENT_ALLOWLIST etc. e concatenar no fanout consumer.
 */
import { PUNCH_EVENTS } from './punch-events';

export const WEBHOOK_EVENT_ALLOWLIST = [
  PUNCH_EVENTS.TIME_ENTRY_CREATED,
  PUNCH_EVENTS.APPROVAL_REQUESTED,
  PUNCH_EVENTS.APPROVAL_RESOLVED,
  PUNCH_EVENTS.DEVICE_PAIRED,
  PUNCH_EVENTS.DEVICE_REVOKED,
] as const;

export type WebhookAllowedEventType = (typeof WEBHOOK_EVENT_ALLOWLIST)[number];
