import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { boardLabelResponseSchema } from '@/http/schemas/tasks';
import { makeListLabelsUseCase } from '@/use-cases/tasks/labels/factories/make-list-labels-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listLabelsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tasks/boards/:boardId/labels',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.BOARDS.READ,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Labels'],
      summary: 'List labels of a board',
      security: [{ bearerAuth: [] }],
      params: z.object({ boardId: z.string().uuid() }),
      response: {
        200: z.object({ labels: z.array(boardLabelResponseSchema) }),
      },
    },
    handler: async (request, reply) => {
      const { boardId } = request.params;

      const useCase = makeListLabelsUseCase();
      const result = await useCase.execute({ boardId });

      return reply.status(200).send(result);
    },
  });
}
