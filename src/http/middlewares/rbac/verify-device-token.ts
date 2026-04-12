import { createHash } from 'node:crypto';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { prisma } from '@/lib/prisma';
import { posDevicePairingPrismaToDomain } from '@/mappers/sales/pos-device-pairing/pos-device-pairing-prisma-to-domain';
import { posTerminalPrismaToDomain } from '@/mappers/sales/pos-terminal/pos-terminal-prisma-to-domain';
import { posSessionPrismaToDomain } from '@/mappers/sales/pos-session/pos-session-prisma-to-domain';
import type { FastifyRequest } from 'fastify';

const DEVICE_TOKEN_HEADER = 'x-pos-device-token';

export async function verifyDeviceToken(request: FastifyRequest) {
  const headerValue = request.headers[DEVICE_TOKEN_HEADER];
  const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!token) {
    throw new UnauthorizedError('Missing device token');
  }

  const deviceTokenHash = createHash('sha256').update(token).digest('hex');

  const pairing = await prisma.posDevicePairing.findUnique({
    where: { deviceTokenHash },
    include: {
      terminal: true,
    },
  });

  if (!pairing || pairing.revokedAt) {
    throw new UnauthorizedError('Invalid or revoked device token');
  }

  const terminal = pairing.terminal;

  if (!terminal || !terminal.isActive || terminal.deletedAt) {
    throw new UnauthorizedError('Terminal is not active');
  }

  const sessionRaw = await prisma.posSession.findFirst({
    where: {
      terminalId: terminal.id,
      tenantId: terminal.tenantId,
      status: 'OPEN',
    },
    orderBy: { openedAt: 'desc' },
  });

  // Update lastSeenAt opportunistically (do not block on failure)
  prisma.posDevicePairing
    .update({
      where: { id: pairing.id },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});

  request.terminal = posTerminalPrismaToDomain(terminal);
  request.devicePairing = posDevicePairingPrismaToDomain(pairing);
  request.currentSession = sessionRaw
    ? posSessionPrismaToDomain(sessionRaw)
    : null;
}
