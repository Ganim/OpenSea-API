import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { generateCampaignsResponseSchema } from '@/http/schemas/ai';
import { makeGenerateCampaignSuggestionsUseCase } from '@/use-cases/ai/campaigns/factories/make-generate-campaign-suggestions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function generateCampaignsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/campaigns/generate',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Campaigns'],
      summary: 'Generate AI campaign suggestions from stock/sales data',
      security: [{ bearerAuth: [] }],
      response: {
        200: generateCampaignsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeGenerateCampaignSuggestionsUseCase();
      const result = await useCase.execute({ tenantId, userId });

      return reply.status(200).send(result);
    },
  });
}
