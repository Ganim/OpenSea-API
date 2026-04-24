/**
 * PunchDeviceOfflineScheduler — Phase 07 / Plan 07-05a (Wave 2).
 *
 * Scheduler in-process (setInterval 60s) que, a cada tick, detecta transições
 * ONLINE↔OFFLINE em cada tenant ativo. Para cada transition:
 *   - Emite Socket.IO `tenant:{id}:hr` com evento
 *     `tenant.hr.devices.status-change` (frontend do dashboard-gestor escuta).
 *   - Persiste AuditLog `PUNCH_DEVICE_STATUS_CHANGED`.
 *
 * **Sem hora-alvo** — diferente dos schedulers 22h/18h. A cada tick executa
 * `CheckDeviceHeartbeatsUseCase` em todos os tenants ativos (tipicamente <50
 * devices por tenant, <100 tenants → <5000 devices/min).
 *
 * **Sem Redis SETNX lock** — o `CheckDeviceHeartbeatsUseCase` tolera races:
 *   - Duas máquinas Fly rodando o mesmo tick independentemente: cada uma
 *     lê o mesmo estado, ambas escrevem o mesmo next status (idempotente).
 *     Pode resultar em AuditLog dupla (aceito via P-mitigation).
 *
 * **Dual gate BULLMQ_ENABLED.**
 */
import { randomUUID } from 'node:crypto';

import { env } from '@/@env';
import { AuditAction } from '@/entities/audit/audit-action.enum';
import { AuditEntity } from '@/entities/audit/audit-entity.enum';
import { AuditModule } from '@/entities/audit/audit-module.enum';
import { getTypedEventBus } from '@/lib/events';
import { PUNCH_EVENTS } from '@/lib/events/punch-events';
import { prisma } from '@/lib/prisma';
import { getSocketServer } from '@/lib/websocket/socket-server';
import { makeCheckDeviceHeartbeatsUseCase } from '@/use-cases/hr/punch-dashboard/factories/make-check-device-heartbeats';

const LOG_PREFIX = '[PunchDeviceOfflineScheduler]';
const TICK_INTERVAL_MS = 60_000;

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

/**
 * Ref export para specs — permite observar env.BULLMQ_ENABLED sem shift
 * process.env em tempo de teste. Runtime usa process.env check (igual
 * aos outros 2 schedulers).
 */
export function _isBullMqEnabled(): boolean {
  return process.env.BULLMQ_ENABLED === 'true' || env.BULLMQ_ENABLED;
}

export async function runPunchDeviceOfflineIfDue(): Promise<void> {
  if (isRunning) return;
  if (process.env.BULLMQ_ENABLED !== 'true' && !env.BULLMQ_ENABLED) return;

  isRunning = true;
  try {
    const tenants = await prisma.tenant.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });

    for (const tenant of tenants) {
      try {
        const useCase = makeCheckDeviceHeartbeatsUseCase();
        const { transitioned, scanned } = await useCase.execute({
          tenantId: tenant.id,
          now: new Date(),
        });

        if (transitioned.length === 0) continue;

        getLogger().info(
          {
            tenantId: tenant.id,
            scanned,
            transitionCount: transitioned.length,
          },
          `${LOG_PREFIX} transitions detected`,
        );

        const io = getSocketServer();
        for (const t of transitioned) {
          // Socket.IO emit em `tenant:{id}:hr` — frontend dashboard-gestor
          // está joined via joinHrRoomsForUser (Plan 07-02).
          try {
            io?.to(`tenant:${tenant.id}:hr`).emit(
              'tenant.hr.devices.status-change',
              {
                deviceId: t.deviceId,
                previousStatus: t.previousStatus,
                nextStatus: t.nextStatus,
                changedAt: new Date().toISOString(),
              },
            );
          } catch (err) {
            getLogger().warn(
              { err, deviceId: t.deviceId },
              `${LOG_PREFIX} socket emit failed`,
            );
          }

          // Typed event bus — downstream consumers (ex.: analytics) reagem.
          try {
            const bus = getTypedEventBus();
            await bus.publish({
              id: randomUUID(),
              type: PUNCH_EVENTS.DEVICE_STATUS_CHANGED,
              version: 1,
              tenantId: tenant.id,
              source: 'hr',
              sourceEntityType: 'punch_device',
              sourceEntityId: t.deviceId,
              data: {
                tenantId: tenant.id,
                deviceId: t.deviceId,
                previousStatus: t.previousStatus,
                nextStatus: t.nextStatus,
                changedAt: new Date().toISOString(),
              } as unknown as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            getLogger().warn(
              { err, deviceId: t.deviceId },
              `${LOG_PREFIX} bus publish failed`,
            );
          }

          // AuditLog inline (worker context — sem FastifyRequest; seguir
          // pattern punch-batch-export-worker).
          try {
            await prisma.auditLog.create({
              data: {
                tenantId: tenant.id,
                action: AuditAction.PUNCH_DEVICE_STATUS_CHANGED,
                entity: AuditEntity.PUNCH_DEVICE,
                module: AuditModule.HR,
                entityId: t.deviceId,
                userId: null,
                description: `Dispositivo ${t.deviceId} transitou de ${t.previousStatus} para ${t.nextStatus}`,
                newData: {
                  previousStatus: t.previousStatus,
                  nextStatus: t.nextStatus,
                },
              },
            });
          } catch (err) {
            getLogger().warn(
              { err, deviceId: t.deviceId },
              `${LOG_PREFIX} audit log failed`,
            );
          }
        }
      } catch (err) {
        getLogger().error(
          { err, tenantId: tenant.id },
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

export async function startPunchDeviceOfflineScheduler(): Promise<void> {
  if (schedulerIntervalId) {
    getLogger().info({}, `${LOG_PREFIX} already running`);
    return;
  }
  if (process.env.BULLMQ_ENABLED !== 'true' && !env.BULLMQ_ENABLED) {
    getLogger().info({}, `${LOG_PREFIX} BULLMQ_ENABLED!=true — not starting`);
    return;
  }
  getLogger().info(
    { tickIntervalMs: TICK_INTERVAL_MS },
    `${LOG_PREFIX} starting`,
  );
  schedulerIntervalId = setInterval(() => {
    void runPunchDeviceOfflineIfDue();
  }, TICK_INTERVAL_MS);
}

export function stopPunchDeviceOfflineScheduler(): void {
  if (schedulerIntervalId) {
    clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
    getLogger().info({}, `${LOG_PREFIX} stopped`);
  }
}
