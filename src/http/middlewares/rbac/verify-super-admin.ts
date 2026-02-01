import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import type { FastifyRequest } from 'fastify';

/**
 * Middleware that verifies the user is a super admin.
 * Must be placed AFTER verifyJwt in the preHandler chain.
 *
 * Super admins are system operators who can manage tenants,
 * plans, and feature flags. They do NOT belong to a specific tenant.
 *
 * Used exclusively for `/v1/admin/*` routes.
 */
export async function verifySuperAdmin(request: FastifyRequest) {
  const user = request.user;

  if (!user || !user.sub) {
    throw new UnauthorizedError('User not authenticated');
  }

  if (!user.isSuperAdmin) {
    throw new ForbiddenError(
      'Access denied. This endpoint requires super admin privileges.',
    );
  }
}
