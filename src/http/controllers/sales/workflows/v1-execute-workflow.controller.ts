import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  executeWorkflowSchema,
  workflowExecutionLogSchema,
} from '@/http/schemas/sales/workflows/workflow.schema';
import { makeExecuteWorkflowUseCase } from '@/use-cases/sales/workflows/factories/make-execute-workflow-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function executeWorkflowController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/workflows/execute',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.WORKFLOWS.EXECUTE,
        resource: 'workflows',
      }),
    ],
    schema: {
      tags: ['Sales - Workflows'],
      summary: 'Execute workflows by trigger',
      body: executeWorkflowSchema,
      response: {
        200: z.object({
          executionLogs: z.array(workflowExecutionLogSchema),
          totalWorkflowsExecuted: z.number(),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { trigger, context } = request.body;

      try {
        const useCase = makeExecuteWorkflowUseCase();
        const executionResult = await useCase.execute({ tenantId, trigger, context });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.WORKFLOW_EXECUTE,
          entityId: tenantId,
          placeholders: {
            workflowName: `${executionResult.totalWorkflowsExecuted} workflow(s)`,
            userName: request.user.sub,
            trigger,
          },
          newData: { trigger, totalExecuted: executionResult.totalWorkflowsExecuted },
        });

        return reply.status(200).send(executionResult as any);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
