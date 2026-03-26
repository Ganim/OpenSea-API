import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { campaignResponseSchema, updateCampaignSchema } from '@/http/schemas';
import { makeGetCampaignByIdUseCase } from '@/use-cases/sales/campaigns/factories/make-get-campaign-by-id-use-case';
import { makeUpdateCampaignUseCase } from '@/use-cases/sales/campaigns/factories/make-update-campaign-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateCampaignController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/campaigns/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CAMPAIGNS.MODIFY,
        resource: 'campaigns',
      }),
    ],
    schema: {
      tags: ['Sales - Campaigns'],
      summary: 'Update a campaign',
      params: z.object({
        id: z.string().uuid().describe('Campaign UUID'),
      }),
      body: updateCampaignSchema,
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
      const userId = request.user.sub;
      const { id } = request.params;
      const body = request.body;

      try {
        // Get existing campaign for audit old data
        const getUseCase = makeGetCampaignByIdUseCase();
        const { campaign: existing } = await getUseCase.execute({
          id,
          tenantId,
        });

        const useCase = makeUpdateCampaignUseCase();
        const { campaign } = await useCase.execute({
          id,
          tenantId,
          name: body.name,
          description: body.description,
          type: body.type as 'PERCENTAGE' | undefined,
          priority: body.priority,
          isStackable: body.stackable,
          maxUsageTotal: body.maxUsageTotal,
          maxUsagePerCustomer: body.maxUsagePerCustomer,
          startDate: body.startDate,
          endDate: body.endDate,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CAMPAIGN_UPDATE,
          entityId: campaign.campaignId.toString(),
          placeholders: {
            userName: userId,
            campaignName: campaign.name,
          },
          oldData: {
            name: existing.name,
            type: existing.type,
            status: existing.status,
          },
          newData: { name: body.name, type: body.type },
        });

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
            createdByUserId: userId,
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
