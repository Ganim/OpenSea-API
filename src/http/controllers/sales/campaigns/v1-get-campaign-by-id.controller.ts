import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { campaignResponseSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
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

      const campaign = await prisma.campaign.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!campaign) {
        return reply.status(404).send({ message: 'Campaign not found' });
      }

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
