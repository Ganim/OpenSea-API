import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateAiConfigBodySchema,
  aiConfigResponseSchema,
} from '@/http/schemas/ai';
import { makeUpdateAiConfigUseCase } from '@/use-cases/ai/config/factories/make-update-ai-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateAiConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/ai/config',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Config'],
      summary: 'Update AI assistant configuration',
      security: [{ bearerAuth: [] }],
      body: updateAiConfigBodySchema,
      response: {
        200: z.object({ config: aiConfigResponseSchema }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeUpdateAiConfigUseCase();
      const result = await useCase.execute({
        tenantId,
        ...request.body,
      });

      return reply.status(200).send(result);
    },
  });
}
