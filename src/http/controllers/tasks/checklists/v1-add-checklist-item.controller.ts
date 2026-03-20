import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  addChecklistItemSchema,
  checklistItemResponseSchema,
} from '@/http/schemas/tasks';
import { makeAddChecklistItemUseCase } from '@/use-cases/tasks/checklists/factories/make-add-checklist-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function addChecklistItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/checklists/:checklistId/items',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASK_CARDS.MODIFY,
        resource: 'task-cards',
      }),
    ],
    schema: {
      tags: ['Tasks - Checklists'],
      summary: 'Add an item to a checklist',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
        checklistId: z.string().uuid(),
      }),
      body: addChecklistItemSchema,
      response: {
        201: z.object({ item: checklistItemResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { boardId, cardId, checklistId } = request.params;

      try {
        const useCase = makeAddChecklistItemUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          boardId,
          cardId,
          checklistId,
          ...request.body,
        });

        return reply.status(201).send({ item: result.checklistItem });
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
