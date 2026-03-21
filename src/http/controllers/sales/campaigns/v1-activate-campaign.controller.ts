import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { campaignResponseSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
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

      const existing = await prisma.campaign.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!existing) {
        return reply.status(404).send({ message: 'Campaign not found' });
      }

      if (existing.status === 'ACTIVE') {
        return reply.status(400).send({ message: 'Campaign is already active' });
      }

      if (existing.status === 'ENDED' || existing.status === 'ARCHIVED') {
        return reply.status(400).send({ message: 'Cannot activate an ended or archived campaign' });
      }

      const campaign = await prisma.campaign.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CAMPAIGN_ACTIVATE,
        entityId: campaign.id,
        placeholders: {
          userName: userId,
          campaignName: campaign.name,
        },
        oldData: { status: existing.status },
        newData: { status: 'ACTIVE' },
      });

      return reply.status(200).send({
        campaign: {
          ...campaign,
          targetAudience: (campaign.targetAudience as Record<string, unknown>) ?? null,
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
