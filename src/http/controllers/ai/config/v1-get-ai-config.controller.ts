import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { aiConfigResponseSchema } from '@/http/schemas/ai';
import { makeGetAiConfigUseCase } from '@/use-cases/ai/config/factories/make-get-ai-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getAiConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/ai/config',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Config'],
      summary: 'Get AI assistant configuration',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ config: aiConfigResponseSchema }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetAiConfigUseCase();
      const result = await useCase.execute({ tenantId });

      return reply.status(200).send(result);
    },
  });
}
