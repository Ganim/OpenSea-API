import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { checklistItemResponseSchema } from '@/http/schemas/tasks';
import { makeToggleChecklistItemUseCase } from '@/use-cases/tasks/checklists/factories/make-toggle-checklist-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function toggleChecklistItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId/toggle',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.CARDS.UPDATE,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Checklists'],
      summary: 'Toggle a checklist item completion',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
        checklistId: z.string().uuid(),
        itemId: z.string().uuid(),
      }),
      body: z.object({ isCompleted: z.boolean() }),
      response: {
        200: z.object({ item: checklistItemResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { boardId, cardId, checklistId, itemId } = request.params;

      try {
        const useCase = makeToggleChecklistItemUseCase();
        const result = await useCase.execute({
          boardId,
          userId,
          userName: 'System',
          cardId,
          checklistId,
          itemId,
          isCompleted: request.body.isCompleted,
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
