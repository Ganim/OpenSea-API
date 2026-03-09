import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  boardResponseSchema,
  listBoardsQuerySchema,
} from '@/http/schemas/tasks';
import { makeListBoardsUseCase } from '@/use-cases/tasks/boards/factories/make-list-boards-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listBoardsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tasks/boards',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.BOARDS.LIST,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Boards'],
      summary: 'List boards',
      security: [{ bearerAuth: [] }],
      querystring: listBoardsQuerySchema,
      response: {
        200: z.object({
          boards: z.array(boardResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeListBoardsUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        ...request.query,
      });

      return reply.status(200).send(result);
    },
  });
}
