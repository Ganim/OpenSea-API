import { createHash } from 'node:crypto';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import type { PosDevicePairingsRepository } from '@/repositories/sales/pos-device-pairings-repository';
import type { FastifyReply, FastifyRequest } from 'fastify';

const BEARER_PREFIX = 'Bearer ';

export interface VerifiedDeviceContext {
  terminalId: string;
  tenantId: string;
  deviceId: string;
}

/**
 * Builds a `verifyDeviceToken` Fastify preHandler bound to a specific
 * `PosDevicePairingsRepository` implementation.
 *
 * The factory form exists so specs can inject an in-memory repo. Production
 * code should use the default export `verifyDeviceToken`, which wires the
 * Prisma implementation.
 *
 * Failure modes (all mapped to `UnauthorizedError`):
 * - `Authorization` header absent
 * - header does not start with `Bearer `
 * - token after `Bearer ` is empty
 * - no pairing found for the SHA-256 hash of the token
 * - pairing exists but `isActive === false` (i.e. revoked)
 *
 * On success, attaches `request.device = { terminalId, tenantId, deviceId }`.
 */
export function makeVerifyDeviceToken(
  pairingsRepository: PosDevicePairingsRepository,
) {
  return async function verifyDeviceToken(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedError('Device token ausente.');
    }

    if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedError(
        'Device token ausente ou com formato inválido.',
      );
    }

    const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();

    if (!token) {
      throw new UnauthorizedError('Device token vazio.');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const pairing = await pairingsRepository.findByTokenHash(tokenHash);

    if (!pairing || !pairing.isActive) {
      throw new UnauthorizedError('Device token inválido ou revogado.');
    }

    (request as FastifyRequest & { device: VerifiedDeviceContext }).device = {
      terminalId: pairing.terminalId.toString(),
      tenantId: pairing.tenantId.toString(),
      deviceId: pairing.pairingId,
    };
  };
}

/**
 * Default Fastify `preHandler` wired to the Prisma-backed repository.
 *
 * The Prisma repo (and `@/lib/prisma`) are imported lazily on the first
 * request so this module can be imported by unit tests without triggering
 * Prisma client construction (which requires `DATABASE_URL` at import time).
 */
let defaultVerifyDeviceToken:
  | ((request: FastifyRequest, reply: FastifyReply) => Promise<void>)
  | null = null;

export async function verifyDeviceToken(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!defaultVerifyDeviceToken) {
    const { PrismaPosDevicePairingsRepository } = await import(
      '@/repositories/sales/prisma/prisma-pos-device-pairings-repository'
    );
    defaultVerifyDeviceToken = makeVerifyDeviceToken(
      new PrismaPosDevicePairingsRepository(),
    );
  }
  return defaultVerifyDeviceToken(request, reply);
}
