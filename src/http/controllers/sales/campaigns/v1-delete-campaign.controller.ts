import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetCampaignByIdUseCase } from '@/use-cases/sales/campaigns/factories/make-get-campaign-by-id-use-case';
import { makeDeleteCampaignUseCase } from '@/use-cases/sales/campaigns/factories/make-delete-campaign-use-case';
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

      try {
        // Get existing for audit
        const getUseCase = makeGetCampaignByIdUseCase();
        const { campaign: existing } = await getUseCase.execute({
          id,
          tenantId,
        });

        const useCase = makeDeleteCampaignUseCase();
        await useCase.execute({ id, tenantId });

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
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
