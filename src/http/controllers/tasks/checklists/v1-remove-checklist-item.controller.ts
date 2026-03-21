import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { resolveUserName } from '@/http/helpers/resolve-user-name';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRemoveChecklistItemUseCase } from '@/use-cases/tasks/checklists/factories/make-remove-checklist-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function removeChecklistItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASKS.CARDS.MODIFY,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Checklists'],
      summary: 'Remove an item from a checklist',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
        checklistId: z.string().uuid(),
        itemId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { boardId, cardId, checklistId, itemId } = request.params;
      const userName = await resolveUserName(userId);

      try {
        const useCase = makeRemoveChecklistItemUseCase();
        await useCase.execute({
          tenantId,
          userId,
          userName,
          boardId,
          cardId,
          checklistId,
          itemId,
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
