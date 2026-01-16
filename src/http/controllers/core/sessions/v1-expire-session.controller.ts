import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeExpireSessionUseCase } from '@/use-cases/core/sessions/factories/make-expire-session-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function expireSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sessions/:sessionId/expire',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.SESSIONS.REVOKE,
        resource: 'sessions',
      }),
    ],
    schema: {
      tags: ['Auth - Sessions'],
      summary: 'Expire session',
      params: z.object({ sessionId: z.uuid() }),
      response: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
      required: ['sessionId'],
    },
    handler: async (request, reply) => {
      const { sessionId } = request.params;
      const adminId = request.user.sub;

      try {
        // Busca nome do admin para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user: admin } = await getUserByIdUseCase.execute({
          userId: adminId,
        });
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const expireSessionUseCase = makeExpireSessionUseCase();
        await expireSessionUseCase.execute({ sessionId });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.SESSION_EXPIRE,
          entityId: sessionId,
          placeholders: {
            adminName,
            userName: `sessão ${sessionId.slice(0, 8)}...`,
          },
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
