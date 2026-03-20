import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetBoardUseCase } from '@/use-cases/tasks/boards/factories/make-get-board-use-case';
import { makeRemoveReactionUseCase } from '@/use-cases/tasks/comments/factories/make-remove-reaction-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function removeReactionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/comments/:commentId/reactions/:emoji',
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
      summary: 'Remove a reaction from a comment',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
        commentId: z.string().uuid(),
        emoji: z.string().min(1),
      }),
      response: {
        204: z.null(),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId, commentId, emoji } = request.params;

      try {
        const getBoardUseCase = makeGetBoardUseCase();
        await getBoardUseCase.execute({ tenantId, userId, boardId });

        const useCase = makeRemoveReactionUseCase();
        await useCase.execute({ tenantId, userId, commentId, emoji });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
