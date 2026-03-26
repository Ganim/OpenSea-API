import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workflowResponseSchema } from '@/http/schemas/sales/workflows/workflow.schema';
import { makeGetWorkflowByIdUseCase } from '@/use-cases/sales/workflows/factories/make-get-workflow-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getWorkflowByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/workflows/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.WORKFLOWS.ACCESS,
        resource: 'workflows',
      }),
    ],
    schema: {
      tags: ['Sales - Workflows'],
      summary: 'Get workflow by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ workflow: workflowResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetWorkflowByIdUseCase();
        const result = await useCase.execute({ tenantId, id });

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
