/**
 * Webhooks cleanup scheduler — Phase 11 / Plan 11-02 / D-23, D-07.
 *
 * Daily job (multi-machine safe via Redis SETNX lock):
 *   1. DELETE WebhookDelivery WHERE status=DEAD AND createdAt < NOW() - 90d (D-23)
 *   2. UPDATE WebhookEndpoint SET secretPrevious=null + secretPreviousExpiresAt=null
 *      WHERE secretPreviousExpiresAt < NOW() (D-07 rotação 7d expirou)
 *
 * Lock key: `webhooks:cleanup:dead-deliveries:${YYYY-MM-DD}`
 * TTL: 48h (garante que mesmo em falha catastrófica o lock expira no dia seguinte)
 *
 * BULLMQ_ENABLED gate: scheduler não inicia + runIfDue defensivamente skipa
 * quando env.BULLMQ_ENABLED=false.
 */
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';

const TICK_INTERVAL_MS = 60_000;
const LOCK_TTL_SECONDS = 48 * 60 * 60; // 48h
const RETENTION_DAYS = 90;
const LOG_PREFIX = '[WebhooksCleanupScheduler]';

let isRunning = false;
let schedulerIntervalId: ReturnType<typeof setInterval> | null = null;

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

/**
 * Execute cleanup if not already running + BULLMQ_ENABLED check + Redis lock acquired.
 * Use direto em smoke tests — NÃO requer scheduler tick.
 */
export async function runWebhooksCleanupIfDue(): Promise<{
  deletedDead: number;
  clearedSecrets: number;
} | null> {
  if (isRunning) return null;
  if (process.env.BULLMQ_ENABLED !== 'true') return null;

  isRunning = true;
  try {
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const lockKey = `webhooks:cleanup:dead-deliveries:${dateKey}`;

    const redis = getRedisClient();

    const locked = await redis.set(lockKey, '1', 'EX', LOCK_TTL_SECONDS, 'NX');
    if (!locked) {
      getLogger().debug({ dateKey }, `${LOG_PREFIX} lock held, skipping`);
      return null;
    }

    // 1. DELETE DEAD older than 90d (D-23)
    const cutoff = new Date(
      now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );
    const deletedResult = await prisma.webhookDelivery.deleteMany({
      where: { status: 'DEAD', createdAt: { lt: cutoff } },
    });

    // 2. Cleanup secretPrevious expirado (D-07)
    const clearedResult = await prisma.webhookEndpoint.updateMany({
      where: { secretPreviousExpiresAt: { lt: now } },
      data: {
        secretPrevious: null,
        secretPreviousExpiresAt: null,
      },
    });

    getLogger().info(
      {
        deletedDead: deletedResult.count,
        clearedSecrets: clearedResult.count,
        dateKey,
      },
      `${LOG_PREFIX} completed`,
    );

    return {
      deletedDead: deletedResult.count,
      clearedSecrets: clearedResult.count,
    };
  } catch (err) {
    getLogger().error({ err }, `${LOG_PREFIX} failure`);
    return null;
  } finally {
    isRunning = false;
  }
}

export async function startWebhooksCleanupScheduler(): Promise<void> {
  if (schedulerIntervalId) return;
  if (process.env.BULLMQ_ENABLED !== 'true') {
    getLogger().info({}, `${LOG_PREFIX} BULLMQ_ENABLED!=true — not starting`);
    return;
  }
  schedulerIntervalId = setInterval(() => {
    void runWebhooksCleanupIfDue();
  }, TICK_INTERVAL_MS);
  getLogger().info({}, `${LOG_PREFIX} started`);
}

export function stopWebhooksCleanupScheduler(): void {
  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
  }
}
