import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listWorkflowsQuerySchema,
  workflowResponseSchema,
  paginatedMetaSchema,
} from '@/http/schemas/ai';
import { makeListWorkflowsUseCase } from '@/use-cases/ai/workflows/factories/make-list-workflows-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listWorkflowsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/ai/workflows',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Workflows'],
      summary: 'List workflows',
      security: [{ bearerAuth: [] }],
      querystring: listWorkflowsQuerySchema,
      response: {
        200: z.object({
          data: z.array(workflowResponseSchema),
          meta: paginatedMetaSchema,
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListWorkflowsUseCase();
      const result = await useCase.execute({
        tenantId,
        ...request.query,
      });

      return reply.status(200).send(result);
    },
  });
}
