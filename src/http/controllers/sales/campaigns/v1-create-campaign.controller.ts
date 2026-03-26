import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { campaignResponseSchema, createCampaignSchema } from '@/http/schemas';
import { makeCreateCampaignUseCase } from '@/use-cases/sales/campaigns/factories/make-create-campaign-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createCampaignController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/campaigns',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CAMPAIGNS.REGISTER,
        resource: 'campaigns',
      }),
    ],
    schema: {
      tags: ['Sales - Campaigns'],
      summary: 'Create a new campaign',
      body: createCampaignSchema,
      response: {
        201: z.object({
          campaign: campaignResponseSchema,
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      try {
        const useCase = makeCreateCampaignUseCase();
        const { campaign } = await useCase.execute({
          tenantId,
          createdByUserId: userId,
          name: body.name,
          description: body.description,
          type: body.type as 'PERCENTAGE',
          discountValue: 0,
          applicableTo: 'ALL',
          startDate: body.startDate,
          endDate: body.endDate,
          maxUsageTotal: body.maxUsageTotal,
          maxUsagePerCustomer: body.maxUsagePerCustomer,
          priority: body.priority,
          isStackable: body.stackable,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CAMPAIGN_CREATE,
          entityId: campaign.campaignId.toString(),
          placeholders: {
            userName: userId,
            campaignName: campaign.name,
          },
          newData: { name: body.name, type: body.type },
        });

        return reply.status(201).send({
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
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
