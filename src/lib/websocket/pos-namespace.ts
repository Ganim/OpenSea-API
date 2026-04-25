import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';

import { createLogger } from '@/lib/logger';
import type { PosDevicePairingsRepository } from '@/repositories/sales/pos-device-pairings-repository';

const posWsLogger = createLogger('POS_WS');

const HEARTBEAT_CHECK_INTERVAL_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 60_000;

/**
 * Active POS terminal WebSocket connection.
 *
 * The connection key (Map key) is a stable opaque connection ID generated
 * on connect — *not* the pairing ID — so the same paired terminal could,
 * in theory, hold multiple sockets (we close the prior one defensively
 * via the standard "replaced by new connection" pattern, but the registry
 * treats each socket as independent).
 */
interface PosWebSocketConnection {
  socket: WebSocket;
  terminalId: string;
  tenantId: string;
  pairingId: string;
  lastHeartbeat: Date;
}

/**
 * Outgoing event envelope. Always JSON-stringified before being sent on
 * the wire. Callers pass plain objects with at least `{ type: string }`.
 */
export interface PosWebSocketOutboundEvent {
  type: string;
  [key: string]: unknown;
}

const activePosConnections = new Map<string, PosWebSocketConnection>();

let heartbeatCheckInterval: NodeJS.Timeout | null = null;

/**
 * Repository factory used to resolve the PosDevicePairingsRepository on
 * each handshake. Tests can override this to inject an in-memory repo
 * via {@link setPosDevicePairingsRepositoryFactory}.
 */
type PosDevicePairingsRepositoryFactory = () => PosDevicePairingsRepository;

let pairingsRepositoryFactory: PosDevicePairingsRepositoryFactory | null = null;

export function setPosDevicePairingsRepositoryFactory(
  factory: PosDevicePairingsRepositoryFactory | null,
): void {
  pairingsRepositoryFactory = factory;
}

async function resolvePairingsRepository(): Promise<PosDevicePairingsRepository> {
  if (pairingsRepositoryFactory) {
    return pairingsRepositoryFactory();
  }
  const { PrismaPosDevicePairingsRepository } = await import(
    '@/repositories/sales/prisma/prisma-pos-device-pairings-repository'
  );
  return new PrismaPosDevicePairingsRepository();
}

interface ParsedHelloMessage {
  type: 'hello';
  deviceToken: string;
}

interface ParsedHeartbeatMessage {
  type: 'heartbeat';
}

interface ParsedSaleSubmitMessage {
  type: 'sale.submit';
  [key: string]: unknown;
}

type ParsedPosMessage =
  | ParsedHelloMessage
  | ParsedHeartbeatMessage
  | ParsedSaleSubmitMessage
  | { type: string; [key: string]: unknown };

function parseClientMessage(raw: Buffer | string): ParsedPosMessage | null {
  try {
    const text =
      typeof raw === 'string'
        ? raw
        : Buffer.isBuffer(raw)
          ? raw.toString('utf8')
          : String(raw);
    const parsed: unknown = JSON.parse(text);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as { type?: unknown }).type === 'string'
    ) {
      return parsed as ParsedPosMessage;
    }
    return null;
  } catch {
    return null;
  }
}

function safeSendJson(
  socket: WebSocket,
  payload: PosWebSocketOutboundEvent,
): boolean {
  if (socket.readyState !== socket.OPEN) {
    return false;
  }
  try {
    socket.send(JSON.stringify(payload));
    return true;
  } catch (error) {
    posWsLogger.error({ err: error }, 'Failed to send POS WS message');
    return false;
  }
}

/**
 * Broadcast an event to every connection associated with a tenant.
 * Returns the number of sockets that actually received the message.
 */
export function broadcastToTenant(
  tenantId: string,
  event: PosWebSocketOutboundEvent,
): number {
  let delivered = 0;
  for (const connection of activePosConnections.values()) {
    if (connection.tenantId === tenantId) {
      if (safeSendJson(connection.socket, event)) {
        delivered += 1;
      }
    }
  }
  return delivered;
}

/**
 * Broadcast an event to every connection bound to a specific terminal.
 * Useful for direct terminal commands (e.g. "force-logout").
 */
export function broadcastToTerminal(
  terminalId: string,
  event: PosWebSocketOutboundEvent,
): number {
  let delivered = 0;
  for (const connection of activePosConnections.values()) {
    if (connection.terminalId === terminalId) {
      if (safeSendJson(connection.socket, event)) {
        delivered += 1;
      }
    }
  }
  return delivered;
}

/** Number of active POS WebSocket connections (observability helper). */
export function getActivePosConnectionCount(): number {
  return activePosConnections.size;
}

/**
 * Test/cleanup helper: forcibly remove every tracked connection without
 * closing the underlying sockets. Intended only for spec teardown.
 */
export function clearPosConnectionsForTesting(): void {
  activePosConnections.clear();
}

/**
 * Handle a subsequent message (post-handshake) on an authenticated POS
 * connection. Exported for unit tests; production code reaches it via the
 * Fastify route handler registered in {@link registerPosWebSocketNamespace}.
 */
export function handleAuthenticatedPosMessage(
  connectionId: string,
  raw: Buffer | string,
): void {
  const connection = activePosConnections.get(connectionId);
  if (!connection) return;

  const message = parseClientMessage(raw);
  if (!message) {
    posWsLogger.warn({ connectionId }, 'Discarded malformed POS WS message');
    return;
  }

  switch (message.type) {
    case 'heartbeat': {
      connection.lastHeartbeat = new Date();
      safeSendJson(connection.socket, { type: 'heartbeat-ack' });
      return;
    }
    case 'sale.submit': {
      // Phase 1 deferral: WebSocket sale submission is not implemented.
      // The desktop terminal must continue using `POST /v1/pos/sales`
      // for sale creation (Task 28). We acknowledge to avoid silent drop
      // and surface a clear instruction to the client.
      // TODO(emporion-fase2): wire to the same use case used by the HTTP
      //   controller so terminals can submit sales over the persistent
      //   socket without round-tripping HTTP.
      safeSendJson(connection.socket, {
        type: 'sale.submit.deferred',
        message:
          'Sale submission via WebSocket is not yet supported. Use POST /v1/pos/sales.',
      });
      return;
    }
    default: {
      // Unknown message types are logged and silently ignored — the
      // protocol is forward-compatible: future versions can add new
      // message types without breaking older terminals.
      posWsLogger.debug(
        { connectionId, type: message.type },
        'Ignoring unknown POS WS message type',
      );
      return;
    }
  }
}

function startHeartbeatChecker(): void {
  if (heartbeatCheckInterval) return;
  heartbeatCheckInterval = setInterval(() => {
    const now = Date.now();
    for (const [connectionId, connection] of activePosConnections) {
      const elapsedMs = now - connection.lastHeartbeat.getTime();
      if (elapsedMs > HEARTBEAT_TIMEOUT_MS) {
        try {
          connection.socket.close(4004, 'Heartbeat timeout');
        } catch (error) {
          posWsLogger.warn(
            { err: error, connectionId },
            'Error closing stale POS WS connection',
          );
        }
        activePosConnections.delete(connectionId);
      }
    }
  }, HEARTBEAT_CHECK_INTERVAL_MS);
  // Don't keep the event loop alive solely for heartbeat checks (lets
  // Fastify shut down cleanly in tests).
  heartbeatCheckInterval.unref?.();
}

function stopHeartbeatCheckerForTesting(): void {
  if (heartbeatCheckInterval) {
    clearInterval(heartbeatCheckInterval);
    heartbeatCheckInterval = null;
  }
}

/** Test helper: forcibly stop the heartbeat checker (spec teardown). */
export const __testing__ = {
  stopHeartbeatChecker: stopHeartbeatCheckerForTesting,
  registerConnection(connection: PosWebSocketConnection): string {
    const connectionId = randomUUID();
    activePosConnections.set(connectionId, connection);
    return connectionId;
  },
  getConnection(connectionId: string): PosWebSocketConnection | undefined {
    return activePosConnections.get(connectionId);
  },
  clearConnections: clearPosConnectionsForTesting,
};

/**
 * Register the POS WebSocket namespace at `GET /v1/pos/ws`.
 *
 * Authentication is performed via a "hello" handshake — the terminal
 * sends `{ type: 'hello', deviceToken }` as its first message. The token
 * is hashed (SHA-256) and matched against `pos_device_pairings`. JWT is
 * deliberately NOT used here: the POS terminal authenticates as a paired
 * device, not as a user.
 *
 * Close codes:
 * - 4001: handshake message wasn't `{ type: 'hello', deviceToken }`
 * - 4002: device token does not match any active pairing
 * - 4003: handshake handler threw (DB error, parse failure, etc.)
 * - 4004: heartbeat timeout (no heartbeat in 60s)
 */
export async function registerPosWebSocketNamespace(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    '/v1/pos/ws',
    { websocket: true },
    async (socket: WebSocket, _request: FastifyRequest) => {
      // Wait for the FIRST message — must be the hello handshake.
      socket.once('message', async (rawHelloBuffer: Buffer) => {
        try {
          const helloMessage = parseClientMessage(rawHelloBuffer);

          if (
            !helloMessage ||
            helloMessage.type !== 'hello' ||
            typeof (helloMessage as { deviceToken?: unknown }).deviceToken !==
              'string' ||
            !(helloMessage as { deviceToken: string }).deviceToken
          ) {
            socket.close(4001, 'Expected hello with deviceToken');
            return;
          }

          const { deviceToken } = helloMessage as { deviceToken: string };
          const tokenHash = createHash('sha256')
            .update(deviceToken)
            .digest('hex');

          const pairingsRepository = await resolvePairingsRepository();
          const pairing = await pairingsRepository.findByTokenHash(tokenHash);

          if (!pairing || !pairing.isActive) {
            socket.close(4002, 'Invalid device token');
            return;
          }

          const connectionId = randomUUID();
          const terminalId = pairing.terminalId.toString();
          const tenantId = pairing.tenantId.toString();

          activePosConnections.set(connectionId, {
            socket,
            terminalId,
            tenantId,
            pairingId: pairing.pairingId,
            lastHeartbeat: new Date(),
          });

          safeSendJson(socket, { type: 'welcome', terminalId });

          posWsLogger.info(
            {
              connectionId,
              terminalId,
              tenantId,
              pairingId: pairing.pairingId,
            },
            'POS terminal connected',
          );

          socket.on('message', (rawMessage: Buffer) => {
            handleAuthenticatedPosMessage(connectionId, rawMessage);
          });

          socket.on('close', (code: number) => {
            activePosConnections.delete(connectionId);
            posWsLogger.info(
              { connectionId, terminalId, code },
              'POS terminal disconnected',
            );
          });

          socket.on('error', (error: Error) => {
            posWsLogger.error(
              { err: error, connectionId, terminalId },
              'POS WebSocket error',
            );
          });
        } catch (error) {
          posWsLogger.error({ err: error }, 'POS WebSocket handshake failed');
          try {
            socket.close(4003, 'Hello failed');
          } catch {
            // Socket already closed; nothing to do.
          }
        }
      });

      // If the client never sends a hello, we still want to free the
      // socket eventually. The HEARTBEAT_TIMEOUT_MS check only covers
      // *registered* connections, so close pre-handshake sockets after
      // a short grace period.
      const helloGraceTimer = setTimeout(() => {
        if (socket.readyState === socket.OPEN) {
          socket.close(4001, 'Hello timeout');
        }
      }, HEARTBEAT_TIMEOUT_MS);
      helloGraceTimer.unref?.();
      socket.once('close', () => clearTimeout(helloGraceTimer));
    },
  );

  startHeartbeatChecker();
}
