/**
 * CheckDeviceHeartbeatsUseCase — Phase 07 / Plan 07-05a (Wave 2).
 *
 * Varre os PunchDevices ativos do tenant e detecta transições ONLINE↔OFFLINE
 * baseadas em `lastSeenAt` vs threshold (3min). Consumido pelo scheduler
 * `punch-device-offline-scheduler` (tick a cada 1min).
 *
 * Transition rules:
 *   - status=ONLINE E (lastSeenAt < now-3min OR lastSeenAt IS NULL) →
 *     transitiona para OFFLINE.
 *   - status=OFFLINE E lastSeenAt >= now-3min → transitiona para ONLINE.
 *   - status=ERROR é preservado (scheduler não toca em devices com erro
 *     reportado manualmente).
 *
 * Retorna a lista de transições `[{ deviceId, previousStatus, nextStatus }]`
 * para que o scheduler emita `PUNCH_EVENTS.DEVICE_STATUS_CHANGED` + audit log.
 *
 * **Use case é PURO:** depende apenas de um shape mínimo do PrismaClient
 * (punchDevice.findMany + punchDevice.update). Sem import de Prisma real.
 */
export const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000;

export interface HeartbeatTransition {
  deviceId: string;
  previousStatus: 'ONLINE' | 'OFFLINE';
  nextStatus: 'ONLINE' | 'OFFLINE';
}

export interface HeartbeatPrismaDevice {
  id: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  lastSeenAt: Date | null;
}

export interface HeartbeatPrisma {
  punchDevice: {
    findMany(args: {
      where: Record<string, unknown>;
      select?: Record<string, unknown>;
    }): Promise<HeartbeatPrismaDevice[]>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
    }): Promise<unknown>;
  };
}

export interface CheckDeviceHeartbeatsInput {
  tenantId: string;
  /** Timestamp de referência — defaults a `new Date()`. */
  now?: Date;
}

export interface CheckDeviceHeartbeatsResult {
  transitioned: HeartbeatTransition[];
  scanned: number;
}

export class CheckDeviceHeartbeatsUseCase {
  constructor(private prisma: HeartbeatPrisma) {}

  async execute(
    input: CheckDeviceHeartbeatsInput,
  ): Promise<CheckDeviceHeartbeatsResult> {
    const now = input.now ?? new Date();
    const threshold = new Date(now.getTime() - OFFLINE_THRESHOLD_MS);

    // Scan devices ativos (sem deletedAt/revokedAt). Sem paginação —
    // um tenant tem tipicamente <50 devices.
    const devices = await this.prisma.punchDevice.findMany({
      where: {
        tenantId: input.tenantId,
        deletedAt: null,
        revokedAt: null,
      },
      select: { id: true, status: true, lastSeenAt: true },
    });

    const transitioned: HeartbeatTransition[] = [];

    for (const device of devices) {
      // ERROR é preservado — scheduler não automatiza transição de erros
      // reportados manualmente (exige intervenção humana).
      if (device.status === 'ERROR') continue;

      const isStale =
        device.lastSeenAt === null ||
        device.lastSeenAt.getTime() < threshold.getTime();

      if (device.status === 'ONLINE' && isStale) {
        await this.prisma.punchDevice.update({
          where: { id: device.id },
          data: { status: 'OFFLINE' },
        });
        transitioned.push({
          deviceId: device.id,
          previousStatus: 'ONLINE',
          nextStatus: 'OFFLINE',
        });
        continue;
      }

      if (device.status === 'OFFLINE' && !isStale) {
        await this.prisma.punchDevice.update({
          where: { id: device.id },
          data: { status: 'ONLINE' },
        });
        transitioned.push({
          deviceId: device.id,
          previousStatus: 'OFFLINE',
          nextStatus: 'ONLINE',
        });
        continue;
      }
    }

    return { transitioned, scanned: devices.length };
  }
}
