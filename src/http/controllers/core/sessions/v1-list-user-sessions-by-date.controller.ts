import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { sessionResponseSchema } from '@/http/schemas';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeListUserSessionsByDateUseCase } from '@/use-cases/core/sessions/factories/make-list-user-sessions-by-date-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listUserSessionsByDateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sessions/user/:userId/by-date',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.SESSIONS.LIST,
        resource: 'sessions',
      }),
    ],
    schema: {
      tags: ['Auth - Sessions'],
      summary: 'List user sessions by date',
      description:
        'Lista as sessoes de um usuario em um periodo especifico. Requer permissao de listagem de sessoes.',
      security: [{ bearerAuth: [] }],
      params: z.object({ userId: z.uuid() }),
      querystring: z.object({
        from: z.coerce.date(),
        to: z.coerce.date(),
      }),
      response: {
        200: z.object({ sessions: z.array(sessionResponseSchema) }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { userId } = request.params;
      const { from, to } = request.query;

      try {
        const listUserSessionsByDate = makeListUserSessionsByDateUseCase();
        const result = await listUserSessionsByDate.execute({
          userId,
          from,
          to,
        });
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
