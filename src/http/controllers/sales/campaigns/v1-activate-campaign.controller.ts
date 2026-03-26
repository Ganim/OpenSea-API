import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { campaignResponseSchema } from '@/http/schemas';
import { makeGetCampaignByIdUseCase } from '@/use-cases/sales/campaigns/factories/make-get-campaign-by-id-use-case';
import { makeActivateCampaignUseCase } from '@/use-cases/sales/campaigns/factories/make-activate-campaign-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function activateCampaignController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/campaigns/:id/activate',
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
      summary: 'Activate a campaign',
      params: z.object({
        id: z.string().uuid().describe('Campaign UUID'),
      }),
      response: {
        200: z.object({
          campaign: campaignResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;

      try {
        // Get existing for audit old data
        const getUseCase = makeGetCampaignByIdUseCase();
        const { campaign: existing } = await getUseCase.execute({
          id,
          tenantId,
        });

        const useCase = makeActivateCampaignUseCase();
        const { campaign } = await useCase.execute({
          id,
          tenantId,
          targetStatus: 'ACTIVE',
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CAMPAIGN_ACTIVATE,
          entityId: campaign.campaignId.toString(),
          placeholders: {
            userName: userId,
            campaignName: campaign.name,
          },
          oldData: { status: existing.status },
          newData: { status: 'ACTIVE' },
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
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
