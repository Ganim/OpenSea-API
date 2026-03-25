import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGenerateInsightsUseCase } from '@/use-cases/ai/insights/factories/make-generate-insights-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function generateInsightsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/insights/generate',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Insights'],
      summary: 'Manually trigger proactive insight generation',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          result: z.object({
            generated: z.number(),
            skippedDuplicates: z.number(),
            errors: z.array(z.string()),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeGenerateInsightsUseCase();
      const { result } = await useCase.execute({ tenantId, userId });

      return reply.status(200).send({ result });
    },
  });
}
