/**
 * PunchDailyDigestScheduler — Phase 07 / Plan 07-05a (Wave 2).
 *
 * Scheduler in-process (setInterval 60s) que, a cada tick, verifica quais
 * tenants estão na hora local 18h (timezone lido em `Tenant.settings.timezone`)
 * e dispara o `ComputeDailyDigestUseCase` para cada um. Multi-machine safety
 * via Redis SETNX lock por-tenant-por-data (TTL 48h).
 *
 * **Dual gate BULLMQ_ENABLED:** ver detect-missed-scheduler para detalhes.
 *
 * **Lock key:** `punch:daily-digest:{tenantId}:{YYYY-MM-DD}`.
 *
 * Opcionalmente emite `PUNCH_EVENTS.DAILY_DIGEST_SENT` por recipient após
 * dispatch bem-sucedido — downstream consumers (analytics) podem registrar.
 */
import { randomUUID } from 'node:crypto';

import { getTypedEventBus } from '@/lib/events';
import { PUNCH_EVENTS } from '@/lib/events/punch-events';
import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis';
import { makeComputeDailyDigestUseCase } from '@/use-cases/hr/punch-dashboard/factories/make-compute-daily-digest';

const LOG_PREFIX = '[PunchDailyDigestScheduler]';
const TICK_INTERVAL_MS = 60_000;
const TARGET_HOUR_LOCAL = 18;
const LOCK_TTL_SECONDS = 48 * 60 * 60;
const FALLBACK_TIMEZONE = 'America/Sao_Paulo';

let schedulerIntervalId: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

let _logger: {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
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
      };
    }
  }
  return _logger!;
}

function getLocalHour(now: Date, timezone: string): number {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    hour12: false,
  });
  const raw = fmt.format(now);
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? now.getUTCHours() : parsed % 24;
}

function getLocalDateKey(now: Date, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now);
}

export async function runPunchDailyDigestIfDue(): Promise<void> {
  if (isRunning) return;
  if (process.env.BULLMQ_ENABLED !== 'true') return;

  isRunning = true;
  try {
    const tenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true, settings: true },
    });

    const redis = getRedisClient();

    for (const tenant of tenants) {
      const tz =
        (tenant.settings as { timezone?: string } | null)?.timezone ??
        FALLBACK_TIMEZONE;
      const now = new Date();
      const hour = getLocalHour(now, tz);
      if (hour !== TARGET_HOUR_LOCAL) continue;

      const dateKey = getLocalDateKey(now, tz);
      const lockKey = `punch:daily-digest:${tenant.id}:${dateKey}`;

      const locked = await redis.set(
        lockKey,
        '1',
        'EX',
        LOCK_TTL_SECONDS,
        'NX',
      );
      if (!locked) {
        getLogger().info(
          { tenantId: tenant.id, dateKey },
          `${LOG_PREFIX} lock held, skipping`,
        );
        continue;
      }

      try {
        const useCase = makeComputeDailyDigestUseCase();
        const result = await useCase.execute({
          tenantId: tenant.id,
          date: now,
        });
        getLogger().info(
          { tenantId: tenant.id, dateKey, ...result },
          `${LOG_PREFIX} completed`,
        );

        // Emite 1 evento por recipient dispatched — analytics consumers podem
        // agregar e contar. Best-effort: falha de bus NÃO falha o digest.
        if (result.dispatchedCount > 0) {
          try {
            const bus = getTypedEventBus();
            for (const userId of result.recipientUserIds) {
              await bus.publish({
                id: randomUUID(),
                type: PUNCH_EVENTS.DAILY_DIGEST_SENT,
                version: 1,
                tenantId: tenant.id,
                source: 'hr',
                sourceEntityType: 'punch_dashboard',
                sourceEntityId: tenant.id,
                data: {
                  tenantId: tenant.id,
                  recipientUserId: userId,
                  date: dateKey,
                  pendingCount: result.pendingCount,
                  approvedCount: result.approvedCount,
                  missingCount: result.missingCount,
                } as unknown as Record<string, unknown>,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (err) {
            getLogger().warn(
              { err, tenantId: tenant.id },
              `${LOG_PREFIX} failed to publish DAILY_DIGEST_SENT events`,
            );
          }
        }
      } catch (err) {
        getLogger().error(
          { err, tenantId: tenant.id, dateKey },
          `${LOG_PREFIX} tenant failed`,
        );
      }
    }
  } catch (err) {
    getLogger().error({ err }, `${LOG_PREFIX} tick failed`);
  } finally {
    isRunning = false;
  }
}

export async function startPunchDailyDigestScheduler(): Promise<void> {
  if (schedulerIntervalId) {
    getLogger().info({}, `${LOG_PREFIX} already running`);
    return;
  }
  if (process.env.BULLMQ_ENABLED !== 'true') {
    getLogger().info({}, `${LOG_PREFIX} BULLMQ_ENABLED!=true — not starting`);
    return;
  }
  getLogger().info(
    { tickIntervalMs: TICK_INTERVAL_MS, targetHourLocal: TARGET_HOUR_LOCAL },
    `${LOG_PREFIX} starting`,
  );
  schedulerIntervalId = setInterval(() => {
    void runPunchDailyDigestIfDue();
  }, TICK_INTERVAL_MS);
}

export function stopPunchDailyDigestScheduler(): void {
  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
    getLogger().info({}, `${LOG_PREFIX} stopped`);
  }
}
