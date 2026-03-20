import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { automationResponseSchema } from '@/http/schemas/tasks';
import { makeToggleAutomationUseCase } from '@/use-cases/tasks/automations/factories/make-toggle-automation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function toggleAutomationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/tasks/boards/:boardId/automations/:automationId/toggle',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.TASK_BOARDS.MODIFY,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Automations'],
      summary: 'Toggle automation active state',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        automationId: z.string().uuid(),
      }),
      body: z.object({ isActive: z.boolean() }),
      response: {
        200: z.object({ automation: automationResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { boardId, automationId } = request.params;

      try {
        const useCase = makeToggleAutomationUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          boardId,
          automationId,
          isActive: request.body.isActive,
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
