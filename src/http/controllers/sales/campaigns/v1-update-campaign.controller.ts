import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { campaignResponseSchema, updateCampaignSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
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

      const existing = await prisma.campaign.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!existing) {
        return reply.status(404).send({ message: 'Campaign not found' });
      }

      // Extract rules and products from body for separate handling
      const { rules, products, targetAudience, ...restData } = body;
      const campaignData = {
        ...restData,
        ...(targetAudience !== undefined && {
          targetAudience: targetAudience as object,
        }),
      };

      const campaign = await prisma.$transaction(async (tx) => {
        // Update rules if provided
        if (rules !== undefined) {
          await tx.campaignRule.deleteMany({ where: { campaignId: id } });
          if (rules && rules.length > 0) {
            await tx.campaignRule.createMany({
              data: rules.map((rule) => ({
                campaignId: id,
                tenantId,
                ruleType: rule.ruleType,
                operator: rule.operator,
                value: rule.value,
                value2: rule.value2,
              })),
            });
          }
        }

        // Update products if provided
        if (products !== undefined) {
          await tx.campaignProduct.deleteMany({ where: { campaignId: id } });
          if (products && products.length > 0) {
            await tx.campaignProduct.createMany({
              data: products.map((product) => ({
                campaignId: id,
                tenantId,
                variantId: product.variantId,
                categoryId: product.categoryId,
                discountType: product.discountType,
                discountValue: product.discountValue,
                maxDiscount: product.maxDiscount,
              })),
            });
          }
        }

        return tx.campaign.update({
          where: { id },
          data: campaignData,
        });
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CAMPAIGN_UPDATE,
        entityId: campaign.id,
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
          ...campaign,
          targetAudience:
            (campaign.targetAudience as Record<string, unknown>) ?? null,
          description: campaign.description ?? null,
          maxUsageTotal: campaign.maxUsageTotal ?? null,
          maxUsagePerCustomer: campaign.maxUsagePerCustomer ?? null,
          aiReason: campaign.aiReason ?? null,
          deletedAt: campaign.deletedAt ?? null,
        },
      });
    },
  });
}
