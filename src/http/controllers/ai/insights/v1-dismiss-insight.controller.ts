import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { insightParamsSchema } from '@/http/schemas/ai';
import { makeDismissInsightUseCase } from '@/use-cases/ai/insights/factories/make-dismiss-insight-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function dismissInsightController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/ai/insights/:insightId/dismiss',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Insights'],
      summary: 'Dismiss an insight',
      security: [{ bearerAuth: [] }],
      params: insightParamsSchema,
      response: {
        200: z.object({ success: z.boolean() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeDismissInsightUseCase();
      const result = await useCase.execute({
        tenantId,
        insightId: request.params.insightId,
      });

      return reply.status(200).send(result);
    },
  });
}
