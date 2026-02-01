import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import type { FastifyRequest } from 'fastify';

/**
 * Middleware that verifies the request has a tenant context.
 * Must be placed AFTER verifyJwt in the preHandler chain.
 *
 * Ensures that `request.user.tenantId` is present, meaning
 * the user has selected a tenant (via POST /v1/auth/select-tenant).
 *
 * Super admins accessing admin routes do NOT need this middleware.
 */
export async function verifyTenant(request: FastifyRequest) {
  const user = request.user;

  if (!user || !user.tenantId) {
    throw new ForbiddenError(
      'No tenant selected. Please select a tenant first via POST /v1/auth/select-tenant',
    );
  }
}
