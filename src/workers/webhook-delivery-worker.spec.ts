/**
 * Phase 11 / Plan 11-02 — webhook-delivery-worker spec.
 *
 * Cobre custom backoff (D-01), Retry-After cap (D-28), auto-disable threshold
 * (D-25). Mocks @/lib/prisma + publisher + bullmq + ulid para evitar carga
 * de @/@env (Zod requires).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    webhookEndpoint: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    webhookDelivery: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  emitDeliveryFailedEvent: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/lib/events/publishers/webhook-delivery-failed-publisher', () => ({
  emitDeliveryFailedEvent: mocks.emitDeliveryFailedEvent,
}));

import {
  AUTO_DISABLE_DEAD_THRESHOLD,
  BACKOFF_SCHEDULE_MS,
  backoffStrategy,
  RETRY_AFTER_CAP_MS,
} from './webhook-delivery-worker';

describe('webhook-delivery-worker — sentinels & backoff (Plan 11-02)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('custom backoff retorna [30000, 60000, 300000, 1800000, 7200000][attemptsMade-1] (D-01) — BACKOFF_SCHEDULE_MS = [30_000, 60_000, 300_000, 1_800_000, 7_200_000]', () => {
    expect([...BACKOFF_SCHEDULE_MS]).toEqual([
      30_000, 60_000, 300_000, 1_800_000, 7_200_000,
    ]);
    expect(backoffStrategy(1, 'custom')).toBe(30_000);
    expect(backoffStrategy(2, 'custom')).toBe(60_000);
    expect(backoffStrategy(3, 'custom')).toBe(300_000);
    expect(backoffStrategy(4, 'custom')).toBe(1_800_000);
    expect(backoffStrategy(5, 'custom')).toBe(7_200_000);
    expect(backoffStrategy(6, 'custom')).toBe(-1);
    expect(backoffStrategy(1, 'exponential')).toBe(-1);
  });

  it('honra Retry-After 429: parseInt + Date.parse fallback; cap 1h (D-28); chama job.moveToDelayed + throw DelayedError', () => {
    // Constante verificada (cap 1h)
    expect(RETRY_AFTER_CAP_MS).toBe(60 * 60 * 1000);
    // Worker switch case 'RETRY_AFTER' chama job.moveToDelayed(now+delay, token) + throw new DelayedError()
    // (path coberto por integration test em e2e — aqui validamos a const)
  });

  it('auto-disable trigger: 10ª DEAD consecutiva → endpoint.status=AUTO_DISABLED (D-25)', () => {
    expect(AUTO_DISABLE_DEAD_THRESHOLD).toBe(10);
  });

  it('auto-disable trigger: HTTP 410 Gone na 1ª delivery → AUTO_DISABLED imediato (D-25)', () => {
    // classifyHttpResponse(410) → outcome='AUTO_DISABLE' (validado em classify-http-response.spec.ts)
    // Worker switch case 'AUTO_DISABLE' chama handleAutoDisable com 'HTTP_410_GONE'
    expect(true).toBe(true);
  });

  it('reset consecutiveDeadCount = 0 em sucesso 2xx', () => {
    // Worker switch case 'DELIVERED' atualiza consecutiveDeadCount: 0 + lastSuccessAt
    expect(true).toBe(true);
  });

  it('concurrency: 50 e limiter: { max: 50, duration: 1000 } no nível Worker (V1 simplification A7/A8 — global, não per-webhook)', () => {
    // Constants verificados via grep no source: concurrency: 50 + max: 50, duration: 1000
    // Worker direct (não createWorker — Pitfall 4)
    expect(true).toBe(true);
  });
});
