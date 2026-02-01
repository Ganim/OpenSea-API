import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeRevokeMySessionUseCase } from '@/use-cases/core/sessions/factories/make-revoke-my-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function revokeMySessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sessions/me/:sessionId/revoke',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Sessions'],
      summary: 'Revoke one of my sessions',
      description:
        'Revoga uma sessao especifica do usuario autenticado. Apenas sessoes proprias podem ser revogadas por este endpoint.',
      security: [{ bearerAuth: [] }],
      params: z.object({ sessionId: z.string().uuid() }),
      response: {
        204: z.void(),
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { sessionId } = request.params;
      const userId = request.user.sub;

      try {
        const revokeMySession = makeRevokeMySessionUseCase();
        await revokeMySession.execute({ sessionId, userId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.SESSION_REVOKE,
          entityId: sessionId,
          placeholders: {
            adminName: 'próprio usuário',
            userName: `sessão ${sessionId.slice(0, 8)}...`,
          },
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
