import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { automationResponseSchema, updateAutomationSchema } from '@/http/schemas/tasks';
import { makeUpdateAutomationUseCase } from '@/use-cases/tasks/automations/factories/make-update-automation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateAutomationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
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
      summary: 'Update a board automation',
      security: [{ bearerAuth: [] }],
      params: z.object({
        boardId: z.string().uuid(),
        automationId: z.string().uuid(),
      }),
      body: updateAutomationSchema,
      response: {
        200: z.object({ automation: automationResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { boardId, automationId } = request.params;

      try {
        const useCase = makeUpdateAutomationUseCase();
        const result = await useCase.execute({
          boardId,
          automationId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.TASKS.AUTOMATION_UPDATE,
          entityId: automationId,
          placeholders: {
            userName: 'System',
            automationName: result.automation.name,
          },
          newData: request.body,
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
