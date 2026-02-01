import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeLogoutSessionUseCase } from '@/use-cases/core/sessions/factories/make-logout-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function logoutSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sessions/logout',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Sessions'],
      summary: 'Logout the current authenticated user session',
      description:
        'Encerra a sessao atual do usuario autenticado e limpa o cookie de refresh token.',
      security: [{ bearerAuth: [] }],
      response: {
        204: z.void(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { sessionId } = request.user;

      if (!sessionId) {
        return reply
          .status(400)
          .send({ message: 'Session ID is missing from token payload.' });
      }

      try {
        const logoutSession = makeLogoutSessionUseCase();
        await logoutSession.execute({
          sessionId,
        });

        // Auditoria de logout
        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.SESSION_LOGOUT,
          entityId: sessionId,
          placeholders: {
            userName: request.user?.sub || 'Usuário',
          },
        });

        // Limpa o cookie de refresh token para evitar acúmulo
        return reply
          .clearCookie('refreshToken', { path: '/' })
          .status(204)
          .send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
