import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  commentResponseSchema,
  listCommentsQuerySchema,
} from '@/http/schemas/tasks';
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
        permissionCode: PermissionCodes.TOOLS.TASKS.CARDS.ACCESS,
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
      const tenantId = request.user.tenantId!;
      const { cardId } = request.params;

      try {
        const page = request.query.page ?? 1;
        const limit = request.query.limit ?? 20;

        const useCase = makeListCommentsUseCase();
        const result = await useCase.execute({
          tenantId,
          cardId,
          page,
          limit,
        });

        return reply.status(200).send({
          comments: result.comments,
          meta: {
            total: result.total,
            page,
            limit,
            pages: Math.ceil(result.total / limit),
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
