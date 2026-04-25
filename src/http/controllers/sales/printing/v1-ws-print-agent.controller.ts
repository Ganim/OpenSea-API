import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import {
  registerAgentConnection,
  unregisterAgentConnection,
} from '@/lib/websocket/print-agent-connections';
import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';

/**
 * Native WebSocket endpoint for the Print Server desktop app.
 *
 * Connection: GET /v1/ws/print-agent?token={agentDeviceToken}
 *
 * This is a public endpoint — the device token (issued during pairing)
 * replaces JWT authentication. The token is hashed with SHA-256 and
 * matched against `print_agents.device_token_hash`.
 *
 * Incoming messages (from Print Server):
 *   { type: 'heartbeat' }
 *   { type: 'printers', printers: [{name, type, isDefault, status}] }
 *   { type: 'print-result', jobId, success, error? }
 *   { type: 'status', status: 'ONLINE' | 'OFFLINE' }
 *
 * Outgoing messages (to Print Server):
 *   { type: 'print', jobId, printerId, data, copies }
 *   { type: 'request-printers' }
 */
export async function v1WsPrintAgentController(app: FastifyInstance) {
  app.get(
    '/v1/ws/print-agent',
    { websocket: true },
    async (socket: WebSocket, request) => {
      const { token } = request.query as { token?: string };

      if (!token) {
        socket.close(4001, 'Missing token query parameter');
        return;
      }

      // Authenticate agent by device token hash
      const deviceTokenHash = createHash('sha256').update(token).digest('hex');

      const agent = await prisma.printAgent.findFirst({
        where: {
          deviceTokenHash,
          deletedAt: null,
          revokedAt: null,
        },
      });

      if (!agent) {
        socket.close(4003, 'Invalid or revoked device token');
        return;
      }

      const agentId = agent.id;
      const tenantId = agent.tenantId;

      // Register connection and set agent online (tenantId enables
      // tenant-scoped broadcasts via `broadcastToPrintServer`).
      registerAgentConnection(agentId, socket, tenantId);

      await prisma.printAgent.update({
        where: { id: agentId },
        data: {
          status: 'ONLINE',
          lastSeenAt: new Date(),
          ipAddress:
            request.headers['x-forwarded-for']?.toString().split(',')[0] ??
            request.ip,
        },
      });

      console.log(
        `[ws:print-agent] Agent "${agent.name}" (${agentId}) connected`,
      );

      // --- Message handling ---

      socket.on('message', async (raw: Buffer) => {
        let message: Record<string, unknown>;

        try {
          message = JSON.parse(raw.toString());
        } catch {
          socket.send(
            JSON.stringify({ type: 'error', message: 'Invalid JSON' }),
          );
          return;
        }

        try {
          await handleAgentMessage(agentId, tenantId, message);
        } catch (error) {
          console.error(
            `[ws:print-agent] Error handling message from agent ${agentId}:`,
            error,
          );
        }
      });

      // --- Disconnect handling ---

      socket.on('close', async () => {
        unregisterAgentConnection(agentId);

        try {
          await prisma.printAgent.update({
            where: { id: agentId },
            data: { status: 'OFFLINE' },
          });

          await prisma.posPrinter.updateMany({
            where: { agentId, deletedAt: null },
            data: { status: 'OFFLINE' },
          });

          console.log(
            `[ws:print-agent] Agent "${agent.name}" (${agentId}) disconnected`,
          );
        } catch (error) {
          console.error(
            `[ws:print-agent] Error during disconnect cleanup for agent ${agentId}:`,
            error,
          );
        }
      });

      socket.on('error', (error: Error) => {
        console.error(
          `[ws:print-agent] Socket error for agent ${agentId}:`,
          error,
        );
      });
    },
  );
}

// --- Message handlers ---

async function handleAgentMessage(
  agentId: string,
  tenantId: string,
  message: Record<string, unknown>,
): Promise<void> {
  const messageType = message.type as string;

  switch (messageType) {
    case 'heartbeat':
      await handleHeartbeat(agentId);
      break;

    case 'printers':
      await handlePrintersReport(agentId, tenantId, message);
      break;

    case 'print-result':
      await handlePrintResult(agentId, message);
      break;

    case 'status':
      await handleStatusUpdate(agentId, message);
      break;

    default:
      console.warn(
        `[ws:print-agent] Unknown message type "${messageType}" from agent ${agentId}`,
      );
  }
}

async function handleHeartbeat(agentId: string): Promise<void> {
  await prisma.printAgent.update({
    where: { id: agentId },
    data: { lastSeenAt: new Date(), status: 'ONLINE' },
  });
}

interface PrinterReport {
  name: string;
  type?: string;
  isDefault: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
}

async function handlePrintersReport(
  agentId: string,
  tenantId: string,
  message: Record<string, unknown>,
): Promise<void> {
  const printers = message.printers as PrinterReport[];
  if (!Array.isArray(printers)) return;

  const reportedOsNames = new Set<string>();

  for (const printerData of printers) {
    reportedOsNames.add(printerData.name);

    const existingPrinter = await prisma.posPrinter.findFirst({
      where: { osName: printerData.name, agentId, tenantId, deletedAt: null },
    });

    if (existingPrinter) {
      await prisma.posPrinter.update({
        where: { id: existingPrinter.id },
        data: {
          status: printerData.status,
          lastSeenAt: new Date(),
        },
      });
    } else {
      await prisma.posPrinter.create({
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
    }
  }
}

async function handlePrintResult(
  agentId: string,
  message: Record<string, unknown>,
): Promise<void> {
  const jobId = message.jobId as string;
  const success = message.success as boolean;
  const errorMessage = message.error as string | undefined;

  if (!jobId) return;

  const printJob = await prisma.printJob.findFirst({
    where: { id: jobId, agentId },
  });

  if (!printJob) return;

  await prisma.printJob.update({
    where: { id: jobId },
    data: {
      status: success ? 'SUCCESS' : 'FAILED',
      completedAt: new Date(),
      ...(errorMessage && { errorMessage }),
    },
  });
}

async function handleStatusUpdate(
  agentId: string,
  message: Record<string, unknown>,
): Promise<void> {
  const status = message.status as 'ONLINE' | 'OFFLINE';
  if (status !== 'ONLINE' && status !== 'OFFLINE') return;

  await prisma.printAgent.update({
    where: { id: agentId },
    data: {
      status,
      lastSeenAt: new Date(),
    },
  });
}
