import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { resolveUserName } from '@/http/helpers/resolve-user-name';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cardResponseSchema, updateCardSchema } from '@/http/schemas/tasks';
import { cardToDTO } from '@/mappers/tasks/card/card-to-dto';
import { makeUpdateSubtaskUseCase } from '@/use-cases/tasks/subtasks/factories/make-update-subtask-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateSubtaskController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/subtasks/:subtaskId',
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
      summary: 'Update a subtask',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
        subtaskId: z.string().uuid(),
      }),
      body: updateCardSchema,
      response: {
        200: z.object({ subtask: cardResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { boardId, subtaskId } = request.params;
      const userName = await resolveUserName(userId);

      try {
        const useCase = makeUpdateSubtaskUseCase();
        const result = await useCase.execute({
          tenantId,
          boardId,
          userId,
          userName,
          subtaskId,
          ...request.body,
        });

        return reply.status(200).send({ subtask: cardToDTO(result.subtask) });
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
