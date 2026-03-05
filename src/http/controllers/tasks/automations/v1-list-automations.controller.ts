import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { automationResponseSchema } from '@/http/schemas/tasks';
import { makeListAutomationsUseCase } from '@/use-cases/tasks/automations/factories/make-list-automations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listAutomationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tasks/boards/:boardId/automations',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.BOARDS.READ,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Automations'],
      summary: 'List board automations',
      security: [{ bearerAuth: [] }],
      params: z.object({ boardId: z.string().uuid() }),
      response: {
        200: z.object({
          automations: z.array(automationResponseSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const { boardId } = request.params;

      const useCase = makeListAutomationsUseCase();
      const result = await useCase.execute({ boardId });

      return reply.status(200).send(result);
    },
  });
}
