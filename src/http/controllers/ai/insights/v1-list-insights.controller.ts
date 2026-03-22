import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listInsightsQuerySchema,
  insightResponseSchema,
} from '@/http/schemas/ai';
import { makeListInsightsUseCase } from '@/use-cases/ai/insights/factories/make-list-insights-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listInsightsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/ai/insights',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Insights'],
      summary: 'List AI proactive insights',
      security: [{ bearerAuth: [] }],
      querystring: listInsightsQuerySchema,
      response: {
        200: z.object({
          insights: z.array(insightResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeListInsightsUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        ...request.query,
      });

      return reply.status(200).send(result);
    },
  });
}
