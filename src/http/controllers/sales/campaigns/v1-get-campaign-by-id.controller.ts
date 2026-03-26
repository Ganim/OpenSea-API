import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { campaignResponseSchema } from '@/http/schemas';
import { makeGetCampaignByIdUseCase } from '@/use-cases/sales/campaigns/factories/make-get-campaign-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getCampaignByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/campaigns/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CAMPAIGNS.ACCESS,
        resource: 'campaigns',
      }),
    ],
    schema: {
      tags: ['Sales - Campaigns'],
      summary: 'Get a campaign by ID',
      params: z.object({
        id: z.string().uuid().describe('Campaign UUID'),
      }),
      response: {
        200: z.object({
          campaign: campaignResponseSchema,
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeGetCampaignByIdUseCase();
        const { campaign } = await useCase.execute({ id, tenantId });

        return reply.status(200).send({
          campaign: {
            id: campaign.campaignId.toString(),
            tenantId: campaign.tenantId.toString(),
            name: campaign.name,
            description: campaign.description ?? null,
            type: campaign.type,
            status: campaign.status,
            startDate: campaign.startDate ?? null,
            endDate: campaign.endDate ?? null,
            maxUsageTotal: campaign.maxUsageTotal ?? null,
            maxUsagePerCustomer: campaign.maxUsagePerCustomer ?? null,
            priority: campaign.priority,
            stackable: campaign.isStackable,
            usageCount: campaign.currentUsageTotal,
            targetAudience: null,
            channels: [],
            aiGenerated: false,
            aiReason: null,
            createdByUserId: request.user.sub,
            deletedAt: campaign.deletedAt ?? null,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt,
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
