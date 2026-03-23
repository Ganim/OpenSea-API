import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { checklistResponseSchema } from '@/http/schemas/tasks';
import { makeListChecklistsUseCase } from '@/use-cases/tasks/checklists/factories/make-list-checklists-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listChecklistsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/checklists',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASKS.CHECKLISTS.ACCESS,
        resource: 'task-checklists',
      }),
    ],
    schema: {
      tags: ['Tasks - Checklists'],
      summary: 'List all checklists for a card',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      response: {
        200: z.object({ checklists: z.array(checklistResponseSchema) }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { boardId, cardId } = request.params;

      try {
        const useCase = makeListChecklistsUseCase();
        const result = await useCase.execute({ boardId, cardId });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
