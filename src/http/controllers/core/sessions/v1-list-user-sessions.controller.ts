import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { sessionResponseSchema } from '@/http/schemas';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeListUserSessionsUseCase } from '@/use-cases/core/sessions/factories/make-list-user-sessions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listUserSessionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sessions/user/:userId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.SESSIONS.LIST,
        resource: 'sessions',
      }),
    ],
    schema: {
      tags: ['Auth - Sessions'],
      summary: 'List sessions by user',
      description:
        'Lista todas as sessoes de um usuario especifico. Requer permissao de listagem de sessoes.',
      security: [{ bearerAuth: [] }],
      params: z.object({ userId: z.uuid() }),
      response: {
        200: z.object({ sessions: z.array(sessionResponseSchema) }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { userId } = request.params;

      try {
        const listUserSessions = makeListUserSessionsUseCase();

        const { sessions } = await listUserSessions.execute({ userId });

        return reply.status(200).send({ sessions });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
