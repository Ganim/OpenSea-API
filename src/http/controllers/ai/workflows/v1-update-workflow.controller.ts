import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  workflowIdParamsSchema,
  updateWorkflowBodySchema,
  workflowResponseSchema,
} from '@/http/schemas/ai';
import { makeUpdateWorkflowUseCase } from '@/use-cases/ai/workflows/factories/make-update-workflow-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function updateWorkflowController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/ai/workflows/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Workflows'],
      summary: 'Update workflow (toggle active, edit fields)',
      security: [{ bearerAuth: [] }],
      params: workflowIdParamsSchema,
      body: updateWorkflowBodySchema,
      response: {
        200: workflowResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeUpdateWorkflowUseCase();
      const result = await useCase.execute({
        workflowId: request.params.id,
        tenantId,
        ...request.body,
      });

      return reply.status(200).send(result);
    },
  });
}
