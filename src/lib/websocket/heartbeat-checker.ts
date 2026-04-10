import { prisma } from '@/lib/prisma';
import { getSocketServer } from './socket-server';
import type { PrinterStatusPayload } from './types';

const STALE_THRESHOLD_MS = 90_000;
const CHECK_INTERVAL_MS = 30_000;

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startHeartbeatChecker(): void {
  intervalId = setInterval(async () => {
    try {
      const threshold = new Date(Date.now() - STALE_THRESHOLD_MS);

      const staleAgents = await prisma.printAgent.findMany({
        where: {
          status: 'ONLINE',
          deletedAt: null,
          lastSeenAt: { lt: threshold },
        },
        include: { printers: { where: { deletedAt: null } } },
      });

      for (const agent of staleAgents) {
        await prisma.printAgent.update({
          where: { id: agent.id },
          data: { status: 'OFFLINE' },
        });

        await prisma.posPrinter.updateMany({
          where: { agentId: agent.id, deletedAt: null },
          data: { status: 'OFFLINE' },
        });

        const io = getSocketServer();

        if (io) {
          for (const printer of agent.printers) {
            const offlineStatus: PrinterStatusPayload = {
              printerId: printer.id,
              printerName: printer.name,
              status: 'OFFLINE',
              agentName: agent.name,
              agentId: agent.id,
              lastSeenAt: agent.lastSeenAt?.toISOString() ?? null,
            };

            io.to(`tenant:${agent.tenantId}:browsers`).emit(
              'printer:status',
              offlineStatus,
            );
          }
        }
      }
    } catch (error) {
      console.error('[heartbeat-checker] Error checking stale agents:', error);
    }
  }, CHECK_INTERVAL_MS);

  intervalId.unref();
}

export function stopHeartbeatChecker(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
