import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteAutomationUseCase } from '@/use-cases/tasks/automations/factories/make-delete-automation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteAutomationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tasks/boards/:boardId/automations/:automationId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TASKS.BOARDS.MANAGE,
        resource: 'task-boards',
      }),
    ],
    schema: {
      tags: ['Tasks - Automations'],
      summary: 'Delete a board automation',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        automationId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { boardId, automationId } = request.params;

      try {
        const useCase = makeDeleteAutomationUseCase();
        await useCase.execute({ tenantId, userId, boardId, automationId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.TASKS.AUTOMATION_DELETE,
          entityId: automationId,
          placeholders: { userName: 'System', automationName: automationId },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
