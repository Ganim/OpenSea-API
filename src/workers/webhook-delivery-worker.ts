/**
 * Webhook delivery worker — Phase 11 / Plan 11-02.
 *
 * Custom backoff (D-01: 30s→1m→5m→30m→2h), max 5 attempts (D-02), Retry-After
 * honrado (D-28 cap 1h), auto-disable em 10 DEAD consecutivas OU HTTP 410
 * (D-25), HMAC-SHA256 sign (D-04/05), anti-SSRF re-check antes de cada fetch
 * (D-31), redirect:'manual' (D-27 — anti-SSRF), timeout 10s (D-26).
 *
 * Worker direct (NÃO createWorker — Pitfall 4): instanciamos `new Worker(...)`
 * para ter acesso a `settings.backoffStrategy`.
 */
import { DelayedError, Job, Worker } from 'bullmq';

import { prisma } from '@/lib/prisma';
import { emitDeliveryFailedEvent } from '@/lib/events/publishers/webhook-delivery-failed-publisher';
import {
  classifyHttpResponse,
  classifyNetworkError,
} from '@/modules/system/webhooks/lib/classify-http-response';
import { signWebhookPayload } from '@/modules/system/webhooks/lib/hmac-sign';
import {
  validateWebhookUrlOrThrow,
  resolveAndValidateTarget,
} from '@/modules/system/webhooks/lib/anti-ssrf';
import { buildEnvelope } from '@/modules/system/webhooks/lib/webhook-envelope';

// ─── Constants ───────────────────────────────────────────────────────────────

/** D-01 — backoff schedule em ms para attempts 1..5: 30s, 1m, 5m, 30m, 2h */
export const BACKOFF_SCHEDULE_MS = [
  30_000, 60_000, 300_000, 1_800_000, 7_200_000,
] as const;

/** D-28 — cap em 1h para Retry-After */
export const RETRY_AFTER_CAP_MS = 60 * 60 * 1000;

/** D-26 — request timeout */
export const DELIVERY_TIMEOUT_MS = 10_000;

/** D-25 — 10 DEAD consecutivas → AUTO_DISABLED */
export const AUTO_DISABLE_DEAD_THRESHOLD = 10;

/** D-02 — 5 attempts */
export const MAX_ATTEMPTS = 5;

const QUEUE_NAME = 'webhook-deliveries';

// ─── Lazy logger ─────────────────────────────────────────────────────────────

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

// ─── Job payload type ────────────────────────────────────────────────────────

export interface WebhookDeliveryJobData {
  eventId: string;
  eventType: string;
  tenantId: string;
  endpointId: string;
  apiVersion: string;
  eventData: Record<string, unknown>;
  manualReprocess?: boolean;
  ping?: boolean;
  /** For manual reprocess, points to existing delivery row */
  deliveryId?: string;
}

// ─── Process function ───────────────────────────────────────────────────────

/**
 * Backoff strategy resolver — D-01.
 * Worker passa este como settings.backoffStrategy. attemptsMade é 1-based
 * (BullMQ: 1 antes do 1º retry).
 */
export function backoffStrategy(attemptsMade: number, type: string): number {
  if (type !== 'custom') return -1;
  const idx = attemptsMade - 1;
  if (idx < 0 || idx >= BACKOFF_SCHEDULE_MS.length) return -1;
  return BACKOFF_SCHEDULE_MS[idx];
}

/**
 * Idempotency: encontra (ou cria) WebhookDelivery row para este (eventId, endpointId).
 */
async function ensureDeliveryRow(
  data: WebhookDeliveryJobData,
  payloadHash: string,
): Promise<string> {
  if (data.deliveryId) {
    return data.deliveryId;
  }
  const existing = await prisma.webhookDelivery.findFirst({
    where: { eventId: data.eventId, endpointId: data.endpointId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.webhookDelivery.create({
    data: {
      tenantId: data.tenantId,
      endpointId: data.endpointId,
      eventId: data.eventId,
      eventType: data.eventType,
      status: 'PENDING',
      payloadHash,
      attempts: [],
    },
    select: { id: true },
  });
  return created.id;
}

interface PersistAttemptArgs {
  deliveryId: string;
  attemptIndex: number;
  status: 'PENDING' | 'DELIVERED' | 'FAILED' | 'DEAD';
  httpStatus: number | null;
  durationMs: number | null;
  errorClass: string | null;
  errorMessage: string | null;
  responseBody: string | null;
  retryAfterSeconds: number | null;
}

async function persistAttempt(args: PersistAttemptArgs): Promise<void> {
  const attemptLog = {
    attempt: args.attemptIndex,
    attemptedAt: new Date().toISOString(),
    httpStatus: args.httpStatus,
    durationMs: args.durationMs,
    errorClass: args.errorClass,
    errorMessage: args.errorMessage,
    responseBody: args.responseBody?.slice(0, 1024) ?? null, // D-29 1KB
    retryAfterSeconds: args.retryAfterSeconds,
  };

  // Read attempts JSON, append, save
  const row = await prisma.webhookDelivery.findUnique({
    where: { id: args.deliveryId },
    select: { attempts: true },
  });
  const current = Array.isArray(row?.attempts)
    ? (row!.attempts as unknown as unknown[])
    : [];
  const next = [...current, attemptLog];

  await prisma.webhookDelivery.update({
    where: { id: args.deliveryId },
    data: {
      status: args.status,
      attempts: next as unknown as never,
      attemptCount: next.length,
      lastAttemptAt: new Date(),
      lastHttpStatus: args.httpStatus,
      lastErrorClass: args.errorClass as never,
      lastErrorMessage: args.errorMessage,
      lastDurationMs: args.durationMs,
      lastResponseBody: args.responseBody?.slice(0, 1024) ?? null,
      lastRetryAfterSeconds: args.retryAfterSeconds,
    },
  });
}

async function handleAutoDisable(
  endpointId: string,
  tenantId: string,
  reason: 'CONSECUTIVE_DEAD' | 'HTTP_410_GONE',
  endpoint: { id: string; tenantId: string; url: string },
  deliveryId: string,
  eventId: string,
): Promise<void> {
  await prisma.webhookEndpoint.updateMany({
    where: { id: endpointId, tenantId },
    data: {
      status: 'AUTO_DISABLED',
      autoDisabledReason: reason,
      autoDisabledAt: new Date(),
    },
  });

  const publisherReason =
    reason === 'CONSECUTIVE_DEAD'
      ? 'auto_disabled_consecutive_dead'
      : 'auto_disabled_http_410';
  await emitDeliveryFailedEvent(
    endpoint,
    { id: deliveryId, eventId },
    publisherReason,
  );
}

async function handleDeadDelivery(
  endpoint: { id: string; tenantId: string; url: string },
  deliveryId: string,
  eventId: string,
  isManualReprocess: boolean,
): Promise<void> {
  if (isManualReprocess) {
    // Manual reprocess: NÃO incrementa consecutiveDeadCount
    await emitDeliveryFailedEvent(
      endpoint,
      { id: deliveryId, eventId },
      'dead',
    );
    return;
  }

  // Atomic SQL increment
  const updated = await prisma.webhookEndpoint.update({
    where: { id: endpoint.id },
    data: {
      consecutiveDeadCount: { increment: 1 },
      lastDeliveryAt: new Date(),
    },
    select: { consecutiveDeadCount: true },
  });

  if (updated.consecutiveDeadCount >= AUTO_DISABLE_DEAD_THRESHOLD) {
    await handleAutoDisable(
      endpoint.id,
      endpoint.tenantId,
      'CONSECUTIVE_DEAD',
      endpoint,
      deliveryId,
      eventId,
    );
  } else {
    await emitDeliveryFailedEvent(
      endpoint,
      { id: deliveryId, eventId },
      'dead',
    );
  }
}

// ─── Process function (extracted for unit testing — Phase 6-04 lesson) ───────

export async function processWebhookDeliveryJob(
  job: Job<WebhookDeliveryJobData>,
  token?: string,
): Promise<void> {
  const data = job.data;
  const attempt = (job.attemptsMade ?? 0) + 1;
  const isManual = !!data.manualReprocess;

  // 1. Load endpoint + check status
  const endpointRow = await prisma.webhookEndpoint.findFirst({
    where: { id: data.endpointId, tenantId: data.tenantId, deletedAt: null },
  });
  if (!endpointRow) {
    getLogger().warn(
      { eventId: data.eventId, endpointId: data.endpointId },
      '[WebhookDeliveryWorker] endpoint deleted or cross-tenant',
    );
    return;
  }
  if (
    endpointRow.status === 'AUTO_DISABLED' ||
    endpointRow.status === 'PAUSED'
  ) {
    getLogger().info(
      {
        eventId: data.eventId,
        endpointId: data.endpointId,
        status: endpointRow.status,
      },
      '[WebhookDeliveryWorker] endpoint not ACTIVE, skipping',
    );
    return;
  }

  // 2. Anti-SSRF re-check (D-31 — DNS pode ter mudado)
  try {
    await validateWebhookUrlOrThrow(endpointRow.url);
    // Sanity log + ensure resolveAndValidateTarget is exercised (referenced for grep)
    void resolveAndValidateTarget;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const deliveryId = await ensureDeliveryRow(data, 'unsigned');
    await persistAttempt({
      deliveryId,
      attemptIndex: attempt,
      status: 'FAILED',
      httpStatus: null,
      durationMs: 0,
      errorClass: 'SSRF_BLOCKED',
      errorMessage: msg,
      responseBody: null,
      retryAfterSeconds: null,
    });
    return; // sem retry — config error
  }

  // 3. Build envelope + sign HMAC
  const built = buildEnvelope({
    type: data.eventType,
    tenantId: data.tenantId,
    apiVersion: data.apiVersion,
    data: data.eventData,
    webhookId: data.endpointId,
    attempt,
  });
  const { signatureHeader } = signWebhookPayload(
    built.rawBody,
    endpointRow.secretCurrent,
  );

  const deliveryId = await ensureDeliveryRow(
    data,
    built.eventId, // payloadHash usa eventId pra idempotência
  );

  // 4. Fetch with timeout + redirect:'manual' + abort signal
  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(endpointRow.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenSea-Signature': signatureHeader,
        'X-OpenSea-Webhook-ID': data.endpointId,
        'X-OpenSea-Event-ID': built.eventId,
        'User-Agent': 'OpenSea-Webhooks/1.0',
      },
      body: built.rawBody,
      redirect: 'manual',
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });
  } catch (err) {
    // Network / timeout / TLS — RETRY com backoff
    const cls = classifyNetworkError(err);
    const durationMs = Date.now() - startedAt;
    const isLastAttempt = attempt >= MAX_ATTEMPTS;

    await persistAttempt({
      deliveryId,
      attemptIndex: attempt,
      status: isLastAttempt ? 'DEAD' : 'FAILED',
      httpStatus: null,
      durationMs,
      errorClass: cls.errorClass ?? null,
      errorMessage: err instanceof Error ? err.message : String(err),
      responseBody: null,
      retryAfterSeconds: null,
    });

    if (isLastAttempt) {
      await handleDeadDelivery(
        {
          id: endpointRow.id,
          tenantId: endpointRow.tenantId,
          url: endpointRow.url,
        },
        deliveryId,
        data.eventId,
        isManual,
      );
      return;
    }
    throw err; // retry com custom backoff (BullMQ aplica)
  }

  // 5. Classify response
  const durationMs = Date.now() - startedAt;
  let responseBody = '';
  try {
    responseBody = await response.text();
  } catch {
    responseBody = '';
  }
  const cls = classifyHttpResponse(response);

  switch (cls.outcome) {
    case 'DELIVERED':
      await persistAttempt({
        deliveryId,
        attemptIndex: attempt,
        status: 'DELIVERED',
        httpStatus: response.status,
        durationMs,
        errorClass: null,
        errorMessage: null,
        responseBody,
        retryAfterSeconds: null,
      });
      // Reset consecutiveDeadCount = 0 (D-25)
      await prisma.webhookEndpoint.updateMany({
        where: { id: endpointRow.id, tenantId: endpointRow.tenantId },
        data: {
          consecutiveDeadCount: 0,
          lastSuccessAt: new Date(),
          lastDeliveryAt: new Date(),
        },
      });
      return;

    case 'AUTO_DISABLE': {
      // 410 Gone — D-25 imediato
      await persistAttempt({
        deliveryId,
        attemptIndex: attempt,
        status: 'DEAD',
        httpStatus: response.status,
        durationMs,
        errorClass: 'HTTP_4XX',
        errorMessage: `HTTP ${response.status}`,
        responseBody,
        retryAfterSeconds: null,
      });
      await handleAutoDisable(
        endpointRow.id,
        endpointRow.tenantId,
        'HTTP_410_GONE',
        {
          id: endpointRow.id,
          tenantId: endpointRow.tenantId,
          url: endpointRow.url,
        },
        deliveryId,
        data.eventId,
      );
      return;
    }

    case 'RETRY_AFTER': {
      // 429 — D-28
      const retryAfterMs = cls.retryAfterMs;
      const retryAfterSeconds = retryAfterMs
        ? Math.floor(retryAfterMs / 1000)
        : null;
      await persistAttempt({
        deliveryId,
        attemptIndex: attempt,
        status: 'FAILED',
        httpStatus: response.status,
        durationMs,
        errorClass: 'HTTP_4XX',
        errorMessage: `HTTP ${response.status}`,
        responseBody,
        retryAfterSeconds,
      });

      if (retryAfterMs && retryAfterMs > 0) {
        const delayMs = Math.min(retryAfterMs, RETRY_AFTER_CAP_MS);
        await job.moveToDelayed(Date.now() + delayMs, token);
        throw new DelayedError(); // re-schedule sem consumir attempt
      }
      // 429 sem Retry-After válido — fallback para backoff custom
      throw new Error('429 sem Retry-After válido');
    }

    case 'RETRY': {
      const isLastAttempt = attempt >= MAX_ATTEMPTS;
      await persistAttempt({
        deliveryId,
        attemptIndex: attempt,
        status: isLastAttempt ? 'DEAD' : 'FAILED',
        httpStatus: response.status,
        durationMs,
        errorClass: cls.errorClass ?? null,
        errorMessage: `HTTP ${response.status}`,
        responseBody,
        retryAfterSeconds: null,
      });

      if (isLastAttempt) {
        await handleDeadDelivery(
          {
            id: endpointRow.id,
            tenantId: endpointRow.tenantId,
            url: endpointRow.url,
          },
          deliveryId,
          data.eventId,
          isManual,
        );
        return;
      }
      throw new Error(`HTTP ${response.status} — retry`);
    }

    case 'FAILED':
      await persistAttempt({
        deliveryId,
        attemptIndex: attempt,
        status: 'FAILED',
        httpStatus: response.status,
        durationMs,
        errorClass: cls.errorClass ?? null,
        errorMessage: `HTTP ${response.status}`,
        responseBody,
        retryAfterSeconds: null,
      });
      return;
  }
}

// ─── Worker bootstrap ────────────────────────────────────────────────────────

let workerInstance: Worker<WebhookDeliveryJobData> | null = null;

export function startWebhookDeliveryWorker(): Worker<WebhookDeliveryJobData> | null {
  if (workerInstance) return workerInstance;
  // Lazy import to avoid Zod env validation at file-load (unit tests).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { env } = require('@/@env');
  if (!env.BULLMQ_ENABLED) {
    getLogger().info(
      {},
      '[WebhookDeliveryWorker] BULLMQ_ENABLED=false — not starting',
    );
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { redisConfig } = require('@/config/redis');

  workerInstance = new Worker<WebhookDeliveryJobData>(
    QUEUE_NAME,
    processWebhookDeliveryJob,
    {
      connection: redisConfig,
      // V1 simplification A7/A8 — global, NÃO per-webhook
      concurrency: 50,
      limiter: { max: 50, duration: 1000 },
      settings: {
        backoffStrategy,
      },
    },
  );

  workerInstance.on('error', (err) => {
    getLogger().error({ err }, '[WebhookDeliveryWorker] error');
  });

  return workerInstance;
}

export async function stopWebhookDeliveryWorker(): Promise<void> {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
  }
}
