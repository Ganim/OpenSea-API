import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workflowIdParamsSchema } from '@/http/schemas/ai';
import { makeDeleteWorkflowUseCase } from '@/use-cases/ai/workflows/factories/make-delete-workflow-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function deleteWorkflowController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/ai/workflows/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Workflows'],
      summary: 'Delete a workflow',
      security: [{ bearerAuth: [] }],
      params: workflowIdParamsSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeDeleteWorkflowUseCase();
      await useCase.execute({
        workflowId: request.params.id,
        tenantId,
      });

      return reply.status(204).send();
    },
  });
}
