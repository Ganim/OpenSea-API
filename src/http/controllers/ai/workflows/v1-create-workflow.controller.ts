import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createWorkflowBodySchema,
  workflowResponseSchema,
} from '@/http/schemas/ai';
import { makeCreateWorkflowUseCase } from '@/use-cases/ai/workflows/factories/make-create-workflow-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function createWorkflowController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/workflows',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Workflows'],
      summary: 'Create a workflow from natural language description',
      security: [{ bearerAuth: [] }],
      body: createWorkflowBodySchema,
      response: {
        201: workflowResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeCreateWorkflowUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        naturalPrompt: request.body.naturalPrompt,
      });

      return reply.status(201).send(result);
    },
  });
}
