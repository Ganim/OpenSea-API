import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { PrismaAccountantAccessesRepository } from '@/repositories/finance/prisma/prisma-accountant-accesses-repository';
import { hashToken } from '@/utils/security/hash-token';
import type { FastifyRequest } from 'fastify';

/**
 * Middleware for accountant portal routes.
 *
 * Validates the accountant access token from the Authorization header
 * and attaches accountant context to the request.
 *
 * Uses simple token-based auth (not JWT) — the incoming raw token is
 * hashed with SHA-256 before lookup against the stored hash.
 */
export async function verifyAccountant(request: FastifyRequest) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de acesso do contador não fornecido.');
  }

  const rawToken = authHeader.slice(7); // Remove 'Bearer '

  if (!rawToken) {
    throw new UnauthorizedError('Token de acesso do contador inválido.');
  }

  const repository = new PrismaAccountantAccessesRepository();
  const hashedToken = hashToken(rawToken);
  const access = await repository.findByToken(hashedToken);

  if (!access) {
    throw new UnauthorizedError('Token de acesso do contador inválido.');
  }

  if (!access.isActive) {
    throw new UnauthorizedError('Acesso do contador desativado.');
  }

  if (access.expiresAt && access.expiresAt < new Date()) {
    throw new UnauthorizedError('Token de acesso do contador expirado.');
  }

  // Update last access timestamp
  await repository.updateLastAccess(access.id);

  // Attach accountant context to the request
  (request as FastifyRequest & { accountant: unknown }).accountant = {
    id: access.id,
    tenantId: access.tenantId,
    email: access.email,
    name: access.name,
  };
}
