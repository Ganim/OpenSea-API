import { compare } from 'bcryptjs';
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
    const { apiKey, token } = socket.handshake.auth as {
      apiKey?: string;
      token?: string;
    };

    if (apiKey) {
      await authenticateAgent(socket, apiKey);
      return next();
    }

    if (token) {
      await authenticateBrowser(socket, token);
      return next();
    }

    return next(new Error('Authentication required: provide apiKey or token'));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Authentication failed';
    return next(new Error(message));
  }
}

async function authenticateAgent(
  socket: Socket,
  apiKey: string,
): Promise<void> {
  const prefix = apiKey.substring(0, 8);

  const agent = await prisma.printAgent.findFirst({
    where: { apiKeyPrefix: prefix, deletedAt: null },
  });

  if (!agent) {
    throw new Error('Invalid API key: agent not found');
  }

  const isValidKey = await compare(apiKey, agent.apiKeyHash);

  if (!isValidKey) {
    throw new Error('Invalid API key: authentication failed');
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
