import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { campaignResponseSchema, createCampaignSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
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

      const campaign = await prisma.campaign.create({
        data: {
          tenantId,
          name: body.name,
          description: body.description,
          type: body.type,
          startDate: body.startDate,
          endDate: body.endDate,
          channels: body.channels,
          targetAudience: body.targetAudience
            ? (body.targetAudience as object)
            : undefined,
          priority: body.priority,
          stackable: body.stackable,
          maxUsageTotal: body.maxUsageTotal,
          maxUsagePerCustomer: body.maxUsagePerCustomer,
          createdByUserId: userId,
          rules: body.rules
            ? {
                createMany: {
                  data: body.rules.map((rule) => ({
                    tenantId,
                    ruleType: rule.ruleType,
                    operator: rule.operator,
                    value: rule.value,
                    value2: rule.value2,
                  })),
                },
              }
            : undefined,
          products: body.products
            ? {
                createMany: {
                  data: body.products.map((product) => ({
                    tenantId,
                    variantId: product.variantId,
                    categoryId: product.categoryId,
                    discountType: product.discountType,
                    discountValue: product.discountValue,
                    maxDiscount: product.maxDiscount,
                  })),
                },
              }
            : undefined,
        },
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CAMPAIGN_CREATE,
        entityId: campaign.id,
        placeholders: {
          userName: userId,
          campaignName: campaign.name,
        },
        newData: { name: body.name, type: body.type },
      });

      return reply.status(201).send({
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
