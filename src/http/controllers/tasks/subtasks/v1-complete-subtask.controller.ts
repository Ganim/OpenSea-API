import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { NotFoundError } from '@/@errors/use-cases/not-found-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cardResponseSchema } from '@/http/schemas/tasks';
import { makeCompleteSubtaskUseCase } from '@/use-cases/tasks/subtasks/factories/make-complete-subtask-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function completeSubtaskController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/subtasks/:subtaskId/complete',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.CARDS.UPDATE,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Subtasks'],
      summary: 'Complete or uncomplete a subtask',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
        subtaskId: z.string().uuid(),
      }),
      body: z.object({ completed: z.boolean().optional().default(true) }),
      response: {
        200: z.object({ subtask: cardResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { boardId, subtaskId } = request.params;

      try {
        const useCase = makeCompleteSubtaskUseCase();
        const result = await useCase.execute({
          boardId,
          userId,
          userName: 'System',
          subtaskId,
          completed: request.body.completed,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof NotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
