/**
 * Stripe-style webhook envelope builder — Phase 11 / Plan 11-02 / D-15.
 *
 * Cada delivery é embrulhada em um JSON envelope com `id: 'evt_<ulid>'`
 * (bytes consultáveis via API por debugging cliente-side) + metadata para
 * idempotência cliente.
 *
 * O `rawBody` retornado é o bytes EXATOS que serão assinados pelo HMAC e
 * enviados no body — manter ordem de keys determinística para que cliente
 * possa validar signature recomputando JSON.stringify (ou comparando bytes
 * brutos do request).
 */
import { ulid } from 'ulid';

export interface WebhookEnvelope {
  /** evt_<26-char ulid> — único por delivery (não por evento) */
  id: string;
  /** Tipo do evento (e.g. 'punch.time-entry.created') */
  type: string;
  /** ISO 8601 — momento do envio (não do evento original) */
  created_at: string;
  /** Tenant que disparou o evento */
  tenant_id: string;
  /** Versão do schema (default '2026-04-27') */
  api_version: string;
  /** Payload específico do evento */
  data: Record<string, unknown>;
  /** Metadata da entrega — útil para idempotência client-side */
  delivery: {
    attempt: number;
    webhook_id: string;
  };
}

export interface BuildEnvelopeArgs {
  type: string;
  tenantId: string;
  apiVersion: string;
  data: Record<string, unknown>;
  webhookId: string;
  attempt: number;
}

export interface BuildEnvelopeResult {
  envelope: WebhookEnvelope;
  /** JSON.stringify(envelope) — bytes assinados pelo HMAC (D-04 invariant) */
  rawBody: string;
  /** evt_<ulid> — facilita idempotência server-side (jobId) */
  eventId: string;
}

export function buildEnvelope(args: BuildEnvelopeArgs): BuildEnvelopeResult {
  const eventId = `evt_${ulid()}`;

  const envelope: WebhookEnvelope = {
    id: eventId,
    type: args.type,
    created_at: new Date().toISOString(),
    tenant_id: args.tenantId,
    api_version: args.apiVersion,
    data: args.data,
    delivery: {
      attempt: args.attempt,
      webhook_id: args.webhookId,
    },
  };

  // Ordem fixa garantida pelo TypeScript object literal — V8/Node JSON.stringify
  // preserva insertion order. Cliente que recomputa HMAC obterá os mesmos bytes.
  const rawBody = JSON.stringify(envelope);

  return { envelope, rawBody, eventId };
}
