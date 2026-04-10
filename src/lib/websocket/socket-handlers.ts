import type { Server as SocketIOServer, Socket } from 'socket.io';

import { prisma } from '@/lib/prisma';
import type {
  AgentHeartbeatPayload,
  AgentJobStatusPayload,
  AgentRegisterPayload,
  PrinterStatusPayload,
  SocketData,
} from './types';

export function registerSocketHandlers(
  io: SocketIOServer,
  socket: Socket,
): void {
  const socketData = socket.data as SocketData;

  if (socketData.type === 'agent') {
    registerAgentHandlers(io, socket, socketData);
  }
}

function registerAgentHandlers(
  io: SocketIOServer,
  socket: Socket,
  socketData: SocketData,
): void {
  const { tenantId, agentId } = socketData;

  if (!agentId) return;

  socket.on('agent:register', async (payload: AgentRegisterPayload) => {
    try {
      const agent = await prisma.printAgent.findFirst({
        where: { id: agentId, deletedAt: null },
      });

      if (!agent) return;

      await prisma.printAgent.update({
        where: { id: agentId },
        data: {
          status: 'ONLINE',
          lastSeenAt: new Date(),
          ipAddress: socket.handshake.address,
          hostname: payload.hostname,
          osInfo: payload.os,
          version: payload.agentVersion,
        },
      });

      const syncedPrinters = await syncPrintersFromPayload(
        tenantId,
        agentId,
        payload.printers,
      );

      broadcastPrinterStatuses(
        io,
        tenantId,
        agentId,
        agent.name,
        syncedPrinters,
      );
    } catch (error) {
      console.error('[ws:agent:register] Error:', error);
    }
  });

  socket.on('agent:heartbeat', async (payload: AgentHeartbeatPayload) => {
    try {
      const agent = await prisma.printAgent.update({
        where: { id: agentId },
        data: { lastSeenAt: new Date(), status: 'ONLINE' },
      });

      const syncedPrinters = await syncPrintersFromPayload(
        tenantId,
        agentId,
        payload.printers,
      );

      broadcastPrinterStatuses(
        io,
        tenantId,
        agentId,
        agent.name,
        syncedPrinters,
      );
    } catch (error) {
      console.error('[ws:agent:heartbeat] Error:', error);
    }
  });

  socket.on('agent:job:status', async (payload: AgentJobStatusPayload) => {
    try {
      const printJob = await prisma.printJob.findFirst({
        where: { id: payload.jobId, agentId },
      });

      if (!printJob) return;

      const updateData: Record<string, unknown> = {
        status: payload.status,
      };

      if (payload.status === 'PRINTING') {
        updateData.startedAt = new Date();
      }

      if (payload.status === 'SUCCESS' || payload.status === 'FAILED') {
        updateData.completedAt = new Date();
      }

      if (payload.status === 'FAILED' && payload.error) {
        updateData.errorMessage = payload.error;
      }

      const updatedJob = await prisma.printJob.update({
        where: { id: payload.jobId },
        data: updateData,
      });

      io.to(`tenant:${tenantId}:browsers`).emit('job:update', {
        jobId: updatedJob.id,
        status: updatedJob.status,
        completedAt: updatedJob.completedAt?.toISOString(),
        error: updatedJob.errorMessage,
      });
    } catch (error) {
      console.error('[ws:agent:job:status] Error:', error);
    }
  });

  socket.on('disconnect', async () => {
    try {
      await prisma.printAgent.update({
        where: { id: agentId },
        data: { status: 'OFFLINE' },
      });

      const agentPrinters = await prisma.posPrinter.findMany({
        where: { agentId, deletedAt: null },
      });

      await prisma.posPrinter.updateMany({
        where: { agentId, deletedAt: null },
        data: { status: 'OFFLINE' },
      });

      const agent = await prisma.printAgent.findFirst({
        where: { id: agentId },
      });

      for (const printer of agentPrinters) {
        const offlineStatus: PrinterStatusPayload = {
          printerId: printer.id,
          printerName: printer.name,
          status: 'OFFLINE',
          agentName: agent?.name ?? 'Unknown',
          agentId,
          lastSeenAt: agent?.lastSeenAt?.toISOString() ?? null,
        };

        io.to(`tenant:${tenantId}:browsers`).emit(
          'printer:status',
          offlineStatus,
        );
      }
    } catch (error) {
      console.error('[ws:agent:disconnect] Error:', error);
    }
  });
}

// --- Helpers ---

interface SyncedPrinterInfo {
  id: string;
  name: string;
  status: string;
  lastSeenAt: Date | null;
}

async function syncPrintersFromPayload(
  tenantId: string,
  agentId: string,
  printers: AgentRegisterPayload['printers'],
): Promise<SyncedPrinterInfo[]> {
  const syncedPrinters: SyncedPrinterInfo[] = [];
  const reportedOsNames = new Set<string>();

  for (const printerData of printers) {
    reportedOsNames.add(printerData.name);

    const existingPrinter = await prisma.posPrinter.findFirst({
      where: { osName: printerData.name, agentId, tenantId, deletedAt: null },
    });

    if (existingPrinter) {
      const updatedPrinter = await prisma.posPrinter.update({
        where: { id: existingPrinter.id },
        data: {
          status: printerData.status,
          lastSeenAt: new Date(),
        },
      });

      syncedPrinters.push({
        id: updatedPrinter.id,
        name: updatedPrinter.name,
        status: updatedPrinter.status,
        lastSeenAt: updatedPrinter.lastSeenAt,
      });
    } else {
      const newPrinter = await prisma.posPrinter.create({
        data: {
          tenantId,
          name: printerData.name,
          type: 'LABEL',
          connection: 'USB',
          osName: printerData.name,
          agentId,
          status: printerData.status,
          isDefault: printerData.isDefault,
          lastSeenAt: new Date(),
        },
      });

      syncedPrinters.push({
        id: newPrinter.id,
        name: newPrinter.name,
        status: newPrinter.status,
        lastSeenAt: newPrinter.lastSeenAt,
      });
    }
  }

  // Mark printers not in the reported list as OFFLINE
  const allAgentPrinters = await prisma.posPrinter.findMany({
    where: { agentId, tenantId, deletedAt: null },
  });

  for (const printer of allAgentPrinters) {
    if (printer.osName && !reportedOsNames.has(printer.osName)) {
      await prisma.posPrinter.update({
        where: { id: printer.id },
        data: { status: 'OFFLINE' },
      });

      syncedPrinters.push({
        id: printer.id,
        name: printer.name,
        status: 'OFFLINE',
        lastSeenAt: printer.lastSeenAt,
      });
    }
  }

  return syncedPrinters;
}

function broadcastPrinterStatuses(
  io: SocketIOServer,
  tenantId: string,
  agentId: string,
  agentName: string,
  printers: SyncedPrinterInfo[],
): void {
  for (const printer of printers) {
    const printerStatus: PrinterStatusPayload = {
      printerId: printer.id,
      printerName: printer.name,
      status: printer.status as PrinterStatusPayload['status'],
      agentName,
      agentId,
      lastSeenAt: printer.lastSeenAt?.toISOString() ?? null,
    };

    io.to(`tenant:${tenantId}:browsers`).emit('printer:status', printerStatus);
  }
}
