import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteWorkflowUseCase } from '@/use-cases/sales/workflows/factories/make-delete-workflow-use-case';
import { makeGetWorkflowByIdUseCase } from '@/use-cases/sales/workflows/factories/make-get-workflow-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteWorkflowController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/sales/workflows/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.WORKFLOWS.REMOVE,
        resource: 'workflows',
      }),
    ],
    schema: {
      tags: ['Sales - Workflows'],
      summary: 'Delete a workflow (soft delete)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;

      try {
        const getUseCase = makeGetWorkflowByIdUseCase();
        const { workflow } = await getUseCase.execute({ tenantId, id });

        const deleteUseCase = makeDeleteWorkflowUseCase();
        const result = await deleteUseCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.WORKFLOW_DELETE,
          entityId: id,
          placeholders: { workflowName: workflow.name, userName: request.user.sub },
          oldData: { id: workflow.id, name: workflow.name },
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
