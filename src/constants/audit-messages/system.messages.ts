import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditMessage } from './types';

/**
 * Mensagens de auditoria do módulo SYSTEM (Phase 11 — Webhooks outbound).
 *
 * PII-safe: usa placeholders apenas (LGPD). NUNCA logar payload completo,
 * URL completa, ou secret cleartext — apenas hashes/last4/máscaras.
 *
 * Templates referenciam:
 *   - {webhookUrlHost}    — apenas host da URL (sem path/query)
 *   - {webhookId}         — id opaco do endpoint
 *   - {subscribedCount}   — quantos eventos o webhook escuta
 *   - {eventId}           — id do envelope (evt_<ulid>)
 *   - {attemptCount}      — número de tentativas até DEAD
 *   - {deliveryId}        — id da delivery
 *   - {manualReprocessCount} — 1..3 reenvios manuais permitidos por delivery
 *   - {reason}            — CONSECUTIVE_DEAD | HTTP_410_GONE
 */
export const SYSTEM_WEBHOOK_AUDIT_MESSAGES = {
  /** Webhook outbound cadastrado pelo admin */
  WEBHOOK_REGISTERED: {
    action: AuditAction.WEBHOOK_REGISTERED,
    entity: AuditEntity.WEBHOOK_ENDPOINT,
    module: AuditModule.SYSTEM,
    description:
      'Webhook outbound cadastrado: {{webhookUrlHost}} (eventos: {{subscribedCount}})',
  } satisfies AuditMessage,

  /** Webhook outbound excluído (PIN gate na UI; D-08 secret rotation context) */
  WEBHOOK_DELETED: {
    action: AuditAction.WEBHOOK_DELETED,
    entity: AuditEntity.WEBHOOK_ENDPOINT,
    module: AuditModule.SYSTEM,
    description: 'Webhook outbound excluído: {{webhookId}}',
  } satisfies AuditMessage,

  /** Entrega de webhook virou DEAD após 5 tentativas (D-02) */
  WEBHOOK_DELIVERY_FAILED: {
    action: AuditAction.WEBHOOK_DELIVERY_FAILED,
    entity: AuditEntity.WEBHOOK_DELIVERY,
    module: AuditModule.SYSTEM,
    description:
      'Entrega de webhook virou DEAD: webhook={{webhookId}} evento={{eventId}} tentativas={{attemptCount}}',
  } satisfies AuditMessage,

  /** Entrega reenviada manualmente (1..3 — D-21) */
  WEBHOOK_DELIVERY_REPROCESSED: {
    action: AuditAction.WEBHOOK_DELIVERY_REPROCESSED,
    entity: AuditEntity.WEBHOOK_DELIVERY,
    module: AuditModule.SYSTEM,
    description:
      'Entrega de webhook reenviada manualmente: delivery={{deliveryId}} reenvio={{manualReprocessCount}}/3',
  } satisfies AuditMessage,

  /** Webhook auto-desativado (10 DEAD consecutivas ou HTTP 410 Gone — D-25) */
  WEBHOOK_AUTO_DISABLED: {
    action: AuditAction.WEBHOOK_AUTO_DISABLED,
    entity: AuditEntity.WEBHOOK_ENDPOINT,
    module: AuditModule.SYSTEM,
    description:
      'Webhook outbound auto-desativado: webhook={{webhookId}} motivo={{reason}}',
  } satisfies AuditMessage,
} as const;
