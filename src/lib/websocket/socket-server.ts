import type { Server as HTTPServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server as SocketIOServer } from 'socket.io';

import { getRedisClient } from '../redis';
import { authenticateSocket } from './socket-auth';
import { registerSocketHandlers } from './socket-handlers';
import type { SocketData } from './types';

let io: SocketIOServer | null = null;

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
    const socketData = socket.data as SocketData;
    const tenantRoom = `tenant:${socketData.tenantId}`;
    const typeRoom =
      socketData.type === 'agent'
        ? `tenant:${socketData.tenantId}:agents`
        : `tenant:${socketData.tenantId}:browsers`;

    socket.join(tenantRoom);
    socket.join(typeRoom);

    if (socketData.type === 'agent' && socketData.agentId) {
      socket.join(`agent:${socketData.agentId}`);
    }

    registerSocketHandlers(io!, socket);
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
