import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { commentResponseSchema, listCommentsQuerySchema } from '@/http/schemas/tasks';
import { makeListCommentsUseCase } from '@/use-cases/tasks/comments/factories/make-list-comments-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listCommentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/comments',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.COMMENTS.READ,
        resource: 'task-comments',
      }),
    ],
    schema: {
      tags: ['Tasks - Comments'],
      summary: 'List comments on a card',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      querystring: listCommentsQuerySchema,
      response: {
        200: z.object({
          comments: z.array(commentResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { cardId } = request.params;

      try {
        const useCase = makeListCommentsUseCase();
        const result = await useCase.execute({
          cardId,
          ...request.query,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
