import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteColumnUseCase } from '@/use-cases/tasks/columns/factories/make-delete-column-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteColumnController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tasks/boards/:boardId/columns/:columnId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASKS.BOARDS.MODIFY,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Columns'],
      summary: 'Delete a column',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        columnId: z.string().uuid(),
      }),
      querystring: z.object({
        migrateToColumnId: z.string().uuid().optional(),
      }),
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { boardId, columnId } = request.params;
      const { migrateToColumnId } = request.query;

      try {
        const useCase = makeDeleteColumnUseCase();
        await useCase.execute({
          tenantId,
          userId,
          boardId,
          columnId,
          migrateToColumnId,
        });

        return reply.status(204).send(null);
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
