import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteCampaignController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/campaigns/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CAMPAIGNS.REMOVE,
        resource: 'campaigns',
      }),
    ],
    schema: {
      tags: ['Sales - Campaigns'],
      summary: 'Delete a campaign (soft delete)',
      params: z.object({
        id: z.string().uuid().describe('Campaign UUID'),
      }),
      response: {
        204: z.null(),
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

      await prisma.campaign.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CAMPAIGN_DELETE,
        entityId: id,
        placeholders: {
          userName: userId,
          campaignName: existing.name,
        },
        oldData: { name: existing.name, type: existing.type },
      });

      return reply.status(204).send(null);
    },
  });
}
