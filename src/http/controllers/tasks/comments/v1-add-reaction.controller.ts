import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  addReactionSchema,
  commentReactionResponseSchema,
} from '@/http/schemas/tasks';
import { makeAddReactionUseCase } from '@/use-cases/tasks/comments/factories/make-add-reaction-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function addReactionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/comments/:commentId/reactions',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASK_CARDS.MODIFY,
        resource: 'task-comments',
      }),
    ],
    schema: {
      tags: ['Tasks - Comments'],
      summary: 'Add a reaction to a comment',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
        commentId: z.string().uuid(),
      }),
      body: addReactionSchema,
      response: {
        201: z.object({ reaction: commentReactionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { cardId, commentId } = request.params;

      try {
        const useCase = makeAddReactionUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          cardId,
          commentId,
          ...request.body,
        });

        return reply.status(201).send(result);
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
