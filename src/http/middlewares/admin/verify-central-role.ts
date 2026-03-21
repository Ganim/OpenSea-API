import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { prisma } from '@/lib/prisma';
import type { FastifyRequest } from 'fastify';

/**
 * Factory that creates a middleware to verify the user belongs to the
 * Central team with one of the allowed roles.
 *
 * Must be placed AFTER verifyJwt in the preHandler chain.
 *
 * On success, attaches `request.centralUser` for downstream handlers.
 *
 * @param allowedRoles - Array of CentralUserRole values that are permitted.
 *
 * @example
 * ```typescript
 * preHandler: [
 *   verifyJwt,
 *   verifyCentralRole(['ADMIN', 'OPERATOR']),
 * ]
 * ```
 */
export function verifyCentralRole(allowedRoles: string[]) {
  return async (request: FastifyRequest) => {
    const userId = request.user?.sub;

    if (!userId) {
      throw new UnauthorizedError('Não autenticado');
    }

    const centralUser = await prisma.centralUser.findUnique({
      where: { userId },
    });

    if (!centralUser) {
      throw new ForbiddenError('Usuário não é membro da equipe Central');
    }

    if (!centralUser.isActive) {
      throw new ForbiddenError('Acesso desativado');
    }

    if (!allowedRoles.includes(centralUser.role)) {
      throw new ForbiddenError('Permissão insuficiente para esta ação');
    }

    // Attach to request for downstream use
    (request as any).centralUser = centralUser;
  };
}
