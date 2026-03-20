import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListCardWatchersUseCase } from '@/use-cases/tasks/watchers/factories/make-list-card-watchers-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const watcherResponseSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  userId: z.string().uuid(),
  boardId: z.string().uuid(),
  createdAt: z.date(),
});

export async function listCardWatchersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tasks/boards/:boardId/cards/:cardId/watchers',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASK_CARDS.ACCESS,
        resource: 'task-watchers',
      }),
    ],
    schema: {
      tags: ['Tasks - Watchers'],
      summary: 'List watchers of a card',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        cardId: z.string().uuid(),
      }),
      response: {
        200: z.object({ watchers: z.array(watcherResponseSchema) }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { boardId, cardId } = request.params;

      try {
        const useCase = makeListCardWatchersUseCase();
        const result = await useCase.execute({
          tenantId,
          boardId,
          cardId,
        });

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
