import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  workflowIdParamsSchema,
  listExecutionsQuerySchema,
  executionResponseSchema,
  paginatedMetaSchema,
} from '@/http/schemas/ai';
import { makeListWorkflowExecutionsUseCase } from '@/use-cases/ai/workflows/factories/make-list-workflow-executions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listExecutionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/ai/workflows/:id/executions',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Workflows'],
      summary: 'List workflow executions',
      security: [{ bearerAuth: [] }],
      params: workflowIdParamsSchema,
      querystring: listExecutionsQuerySchema,
      response: {
        200: z.object({
          data: z.array(executionResponseSchema),
          meta: paginatedMetaSchema,
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListWorkflowExecutionsUseCase();
      const result = await useCase.execute({
        workflowId: request.params.id,
        tenantId,
        ...request.query,
      });

      return reply.status(200).send(result);
    },
  });
}
