import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createWorkflowSchema,
  workflowResponseSchema,
} from '@/http/schemas/sales/workflows/workflow.schema';
import { makeCreateWorkflowUseCase } from '@/use-cases/sales/workflows/factories/make-create-workflow-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createWorkflowController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/workflows',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.WORKFLOWS.REGISTER,
        resource: 'workflows',
      }),
    ],
    schema: {
      tags: ['Sales - Workflows'],
      summary: 'Create a new workflow',
      body: createWorkflowSchema,
      response: {
        201: z.object({ workflow: workflowResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const useCase = makeCreateWorkflowUseCase();
        const { workflow } = await useCase.execute({ tenantId, ...body });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.WORKFLOW_CREATE,
          entityId: workflow.id,
          placeholders: {
            workflowName: workflow.name,
            userName: request.user.sub,
          },
          newData: { name: body.name, trigger: body.trigger },
        });

        return reply.status(201).send({ workflow });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
