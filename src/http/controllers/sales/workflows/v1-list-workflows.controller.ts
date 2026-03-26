import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workflowResponseSchema } from '@/http/schemas/sales/workflows/workflow.schema';
import { makeListWorkflowsUseCase } from '@/use-cases/sales/workflows/factories/make-list-workflows-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listWorkflowsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/workflows',
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
      summary: 'List workflows',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
      }),
      response: {
        200: z.object({
          workflows: z.array(workflowResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const query = request.query;
      const tenantId = request.user.tenantId!;

      const useCase = makeListWorkflowsUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.status(200).send(result);
    },
  });
}
