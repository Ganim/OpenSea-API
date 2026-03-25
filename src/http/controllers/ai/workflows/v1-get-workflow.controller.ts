import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  workflowIdParamsSchema,
  workflowDetailResponseSchema,
} from '@/http/schemas/ai';
import { makeGetWorkflowUseCase } from '@/use-cases/ai/workflows/factories/make-get-workflow-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getWorkflowController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/ai/workflows/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Workflows'],
      summary: 'Get workflow details with recent executions',
      security: [{ bearerAuth: [] }],
      params: workflowIdParamsSchema,
      response: {
        200: workflowDetailResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetWorkflowUseCase();
      const result = await useCase.execute({
        workflowId: request.params.id,
        tenantId,
      });

      return reply.status(200).send(result);
    },
  });
}
