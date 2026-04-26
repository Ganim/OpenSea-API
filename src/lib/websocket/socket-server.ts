import type { Server as HTTPServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server as SocketIOServer, type Socket } from 'socket.io';

import { getRedisClient } from '../redis';
import { joinHrRoomsForUser } from './hr-socket-scope';
import { authenticateSocket } from './socket-auth';
import { registerSocketHandlers } from './socket-handlers';
import type { SocketData } from './types';
import { logger } from '@/lib/logger';

let io: SocketIOServer | null = null;

/**
 * Connection handler extracted for unit testability (Phase 7 / Plan 07-02).
 *
 * Mirrors the original `io.on('connection', ...)` closure verbatim, with the
 * addition of `joinHrRoomsForUser` auto-join for browser sockets with a
 * userId — fixes the silent bug where workers emitted to `tenant:{id}:hr`
 * but no socket was ever joined to that room (RESEARCH §2 + §CE-2).
 */
export async function handleSocketConnection(socket: Socket): Promise<void> {
  const socketData = socket.data as SocketData;
  const tenantRoom = `tenant:${socketData.tenantId}`;
  const typeRoom =
    socketData.type === 'agent'
      ? `tenant:${socketData.tenantId}:agents`
      : socketData.type === 'punch-agent'
        ? `tenant:${socketData.tenantId}:punch-agents`
        : `tenant:${socketData.tenantId}:browsers`;

  socket.join(tenantRoom);
  socket.join(typeRoom);

  if (socketData.type === 'agent' && socketData.agentId) {
    socket.join(`agent:${socketData.agentId}`);
  }

  // Phase 10 / Plan 10-01 — punch-agent dedicated room (D-D1)
  // Server pushes: device.revoked, device.force_update, employee.updated
  // Room name follows ADR-027: tenant:{id}:punch-agent:{deviceId}
  if (socketData.type === 'punch-agent' && socketData.deviceId) {
    const room = `tenant:${socketData.tenantId}:punch-agent:${socketData.deviceId}`;
    socket.join(room);
    logger.info(`[socket] punch-agent ${socketData.deviceId} joined ${room}`);
  }

  // Notifications room — lets the notifications module emit
  // per-user real-time events (notification:new, notification:resolved, etc.)
  if (socketData.type === 'browser' && socketData.userId) {
    socket.join(`user:${socketData.userId}`);
    // Phase 7 — auto-join HR rooms when user has hr.* permissions.
    // Without this, workers emitting to `tenant:{id}:hr` silently drop
    // events because the Redis Adapter only routes to joined sockets.
    await joinHrRoomsForUser(socket, socketData.userId, socketData.tenantId);
  }

  if (io) {
    registerSocketHandlers(io, socket);
  }
}

export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ],
      credentials: true,
    },
    pingInterval: 25_000,
    pingTimeout: 10_000,
    // Fly.io proxy doesn't negotiate permessage-deflate reliably — disabling
    // prevents "Invalid frame header" errors on wss:// upgrades.
    perMessageDeflate: false,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });

  // Redis adapter: required when running multiple Fly machines, otherwise
  // polling sessions break because round-robin routes XHR requests to a
  // machine that doesn't know the sid (400 Bad Request).
  const pubClient = getRedisClient().duplicate();
  const subClient = getRedisClient().duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    void handleSocketConnection(socket);
  });

  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

/** Emit a job event to a specific print agent */
export function emitJobToAgent(
  agentId: string,
  event: string,
  payload: unknown,
): void {
  io?.to(`agent:${agentId}`).emit(event, payload);
}

/** Emit an event to all browser connections in a tenant */
export function emitToBrowsers(
  tenantId: string,
  event: string,
  payload: unknown,
): void {
  io?.to(`tenant:${tenantId}:browsers`).emit(event, payload);
}

/** Emit an event to all sockets for a specific user (notifications module) */
export function emitToUser(
  userId: string,
  event: string,
  payload: unknown,
): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
