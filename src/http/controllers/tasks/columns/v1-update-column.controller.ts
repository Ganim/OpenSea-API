import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  boardColumnResponseSchema,
  updateColumnSchema,
} from '@/http/schemas/tasks';
import { makeUpdateColumnUseCase } from '@/use-cases/tasks/columns/factories/make-update-column-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateColumnController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId/columns/:columnId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.BOARDS.UPDATE,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Columns'],
      summary: 'Update a column',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        columnId: z.string().uuid(),
      }),
      body: updateColumnSchema,
      response: {
        200: z.object({ column: boardColumnResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { boardId, columnId } = request.params;

      try {
        const useCase = makeUpdateColumnUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          boardId,
          columnId,
          ...request.body,
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
