import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { insightParamsSchema } from '@/http/schemas/ai';
import { makeViewInsightUseCase } from '@/use-cases/ai/insights/factories/make-view-insight-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function viewInsightController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/ai/insights/:insightId/view',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Insights'],
      summary: 'Mark an insight as viewed',
      security: [{ bearerAuth: [] }],
      params: insightParamsSchema,
      response: {
        200: z.object({ success: z.boolean() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeViewInsightUseCase();
      const result = await useCase.execute({
        tenantId,
        insightId: request.params.insightId,
      });

      return reply.status(200).send(result);
    },
  });
}
