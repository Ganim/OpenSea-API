/**
 * Webhook fanout consumer — Phase 11 / Plan 11-02 / D-16, D-35.
 *
 * Subscreve EXATAMENTE os 5 eventos punch.* da WEBHOOK_EVENT_ALLOWLIST
 * (NÃO Object.values — Pitfall 12: outros punch.* eventos contêm sinais
 * antifraude que NÃO devem ir para sistemas externos).
 *
 * Para cada evento recebido:
 *   1. Lê endpoints ACTIVE do MESMO tenantId que assinam o evento (D-35)
 *   2. Para cada match, enfileira 1 job em `webhook-deliveries` queue:
 *      - jobId = `${event.id}:${endpoint.id}` (idempotency)
 *      - attempts: 5 (D-02)
 *      - backoff: { type: 'custom' } (D-01 worker.settings.backoffStrategy)
 *
 * Cross-tenant guard: D-35 — `tenantId === event.tenantId` filter IS THE
 * primary defense. Spec asserta tenant A não vê webhook de tenant B.
 */
import { prisma } from '@/lib/prisma';
import { createQueue } from '@/lib/queue';

import type { DomainEvent, EventConsumer } from '../domain-event.interface';
import { WEBHOOK_EVENT_ALLOWLIST } from '../webhook-events';

// Lazy logger — pattern Plan 04-05.
let _logger: {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
  debug: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
        warn: (obj, msg) => console.warn(msg, obj),
        error: (obj, msg) => console.error(msg, obj),
        debug: (obj, msg) => console.debug(msg, obj),
      };
    }
  }
  return _logger!;
}

export const webhookFanoutConsumer: EventConsumer = {
  consumerId: 'system.webhooks.fanout',
  moduleId: 'system.webhooks',
  // D-16 + Pitfall 12 — allowlist hardcoded
  subscribesTo: [...WEBHOOK_EVENT_ALLOWLIST],

  async handle(event: DomainEvent): Promise<void> {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        tenantId: event.tenantId, // D-35 STRICT
        status: 'ACTIVE',
        deletedAt: null,
        subscribedEvents: { has: event.type },
      },
      select: { id: true, url: true, apiVersion: true },
    });

    if (endpoints.length === 0) {
      getLogger().debug(
        {
          eventId: event.id,
          type: event.type,
          tenantId: event.tenantId,
        },
        '[WebhookFanout] No subscribed endpoints',
      );
      return;
    }

    const queue = createQueue('webhook-deliveries');
    for (const endpoint of endpoints) {
      await queue.add(
        'webhook-deliveries',
        {
          eventId: event.id,
          eventType: event.type,
          tenantId: event.tenantId,
          endpointId: endpoint.id,
          apiVersion: endpoint.apiVersion,
          eventData: event.data,
        },
        {
          jobId: `${event.id}:${endpoint.id}`, // dedup per-webhook
          attempts: 5, // D-02
          backoff: { type: 'custom' }, // D-01 — worker resolve via settings.backoffStrategy
        },
      );
    }

    getLogger().info(
      {
        eventId: event.id,
        type: event.type,
        tenantId: event.tenantId,
        fannedOut: endpoints.length,
      },
      '[WebhookFanout] Enqueued deliveries',
    );
  },
};
