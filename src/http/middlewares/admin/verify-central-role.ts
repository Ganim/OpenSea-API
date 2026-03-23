import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { prisma } from '@/lib/prisma';
import type { CentralUserRole } from '@prisma/generated/client.js';
import type { FastifyRequest } from 'fastify';

/**
 * Factory that creates a middleware to verify if the requesting user
 * has the required Central role.
 *
 * Must be placed AFTER verifyJwt and verifySuperAdmin in the preHandler chain.
 *
 * @param allowedRoles - Array of CentralUserRole values that are allowed access
 * @returns Fastify preHandler middleware
 *
 * @example
 * ```typescript
 * preHandler: [
 *   verifyJwt,
 *   verifySuperAdmin,
 *   verifyCentralRole(['ADMIN', 'OWNER']),
 * ]
 * ```
 */
export function verifyCentralRole(allowedRoles: CentralUserRole[]) {
  return async function verifyCentralRoleHandler(request: FastifyRequest) {
    const user = request.user;

    if (!user || !user.sub) {
      throw new UnauthorizedError('User not authenticated');
    }

    const centralUser = await prisma.centralUser.findUnique({
      where: { userId: user.sub },
    });

    if (!centralUser) {
      throw new ForbiddenError('Usuário não é membro da equipe Central.');
    }

    if (!allowedRoles.includes(centralUser.role)) {
      throw new ForbiddenError('Permissão insuficiente para esta ação.');
    }

    // Attach centralUser to request for downstream use
    (request as unknown as Record<string, unknown>).centralUser = centralUser;
  };
}
