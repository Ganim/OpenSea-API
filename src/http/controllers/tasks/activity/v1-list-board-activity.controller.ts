import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  activityResponseSchema,
  listActivityQuerySchema,
} from '@/http/schemas/tasks';
import { makeListBoardActivityUseCase } from '@/use-cases/tasks/activity/factories/make-list-board-activity-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listBoardActivityController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tasks/boards/:boardId/activity',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.BOARDS.READ,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Activity'],
      summary: 'List board activity log',
      security: [{ bearerAuth: [] }],
      params: z.object({ boardId: z.string().uuid() }),
      querystring: listActivityQuerySchema,
      response: {
        200: z.object({
          activities: z.array(activityResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { boardId } = request.params;

      try {
        const page = request.query.page ?? 1;
        const limit = request.query.limit ?? 20;

        const useCase = makeListBoardActivityUseCase();
        const result = await useCase.execute({
          tenantId: request.user.tenantId!,
          boardId,
          type: request.query.type,
          page,
          limit,
        });

        return reply.status(200).send({
          activities: result.activities,
          meta: {
            total: result.total,
            page,
            limit,
            pages: Math.ceil(result.total / limit),
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
