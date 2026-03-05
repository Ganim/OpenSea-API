import { NotFoundError } from '@/@errors/use-cases/not-found-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteSubtaskUseCase } from '@/use-cases/tasks/subtasks/factories/make-delete-subtask-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteSubtaskController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/subtasks/:subtaskId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.CARDS.DELETE,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Subtasks'],
      summary: 'Delete a subtask',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
        subtaskId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { boardId, subtaskId } = request.params;

      try {
        const useCase = makeDeleteSubtaskUseCase();
        await useCase.execute({
          boardId,
          userId,
          userName: 'System',
          subtaskId,
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
