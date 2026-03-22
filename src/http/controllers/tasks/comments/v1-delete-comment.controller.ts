import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { resolveUserName } from '@/http/helpers/resolve-user-name';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetBoardUseCase } from '@/use-cases/tasks/boards/factories/make-get-board-use-case';
import { makeDeleteCommentUseCase } from '@/use-cases/tasks/comments/factories/make-delete-comment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteCommentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/comments/:commentId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASKS.CARDS.MODIFY,
        resource: 'task-comments',
      }),
    ],
    schema: {
      tags: ['Tasks - Comments'],
      summary: 'Delete a comment',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
        commentId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId, cardId, commentId } = request.params;
      const userName = await resolveUserName(userId);

      try {
        const getBoardUseCase = makeGetBoardUseCase();
        await getBoardUseCase.execute({ tenantId, userId, boardId });

        const useCase = makeDeleteCommentUseCase();
        await useCase.execute({
          tenantId,
          userId,
          userName,
          boardId,
          cardId,
          commentId,
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
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
