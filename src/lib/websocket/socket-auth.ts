import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';

import { prisma } from '@/lib/prisma';
import type { SocketData } from './types';

// Lazy import to avoid @env initialization in unit tests
async function getJwtSecret(): Promise<string> {
  const { env } = await import('@/@env');
  return env.JWT_SECRET;
}

export async function authenticateSocket(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const { deviceToken, token } = socket.handshake.auth as {
      deviceToken?: string;
      token?: string;
    };

    if (deviceToken) {
      await authenticateAgent(socket, deviceToken);
      return next();
    }

    if (token) {
      await authenticateBrowser(socket, token);
      return next();
    }

    return next(
      new Error('Authentication required: provide deviceToken or token'),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed';
    return next(new Error(message));
  }
}

async function authenticateAgent(
  socket: Socket,
  deviceToken: string,
): Promise<void> {
  const deviceTokenHash = createHash('sha256')
    .update(deviceToken)
    .digest('hex');

  const agent = await prisma.printAgent.findFirst({
    where: {
      deviceTokenHash,
      deletedAt: null,
      revokedAt: null,
    },
  });

  if (!agent) {
    throw new Error('Invalid or revoked device token');
  }

  const socketData: SocketData = {
    type: 'agent',
    tenantId: agent.tenantId,
    agentId: agent.id,
  };

  socket.data = socketData;
}

async function authenticateBrowser(
  socket: Socket,
  token: string,
): Promise<void> {
  const secret = await getJwtSecret();

  const decoded = jwt.verify(token, secret, {
    issuer: 'opensea-api',
    audience: 'opensea-client',
  }) as { sub: string; tenantId?: string };

  if (!decoded.sub) {
    throw new Error('Invalid token: missing user identifier');
  }

  if (!decoded.tenantId) {
    throw new Error('Invalid token: missing tenant identifier');
  }

  const socketData: SocketData = {
    type: 'browser',
    tenantId: decoded.tenantId,
    userId: decoded.sub,
  };

  socket.data = socketData;
}
