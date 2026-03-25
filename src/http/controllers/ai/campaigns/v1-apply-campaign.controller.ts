import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  campaignInsightParamsSchema,
  applyCampaignResponseSchema,
} from '@/http/schemas/ai';
import { makeApplyCampaignUseCase } from '@/use-cases/ai/campaigns/factories/make-apply-campaign-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function applyCampaignController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/campaigns/:insightId/apply',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Campaigns'],
      summary: 'Apply a campaign suggestion by executing its suggested actions',
      security: [{ bearerAuth: [] }],
      params: campaignInsightParamsSchema,
      response: {
        200: applyCampaignResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeApplyCampaignUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        insightId: request.params.insightId,
      });

      return reply.status(200).send(result);
    },
  });
}
