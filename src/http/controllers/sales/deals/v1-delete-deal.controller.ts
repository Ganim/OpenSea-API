import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteDealUseCase } from '@/use-cases/sales/deals/factories/make-delete-deal-use-case';
import { makeGetDealByIdUseCase } from '@/use-cases/sales/deals/factories/make-get-deal-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteDealController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/deals/:dealId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.DEALS.REMOVE,
        resource: 'deals',
      }),
    ],
    schema: {
      tags: ['Sales - Deals'],
      summary: 'Delete a deal (soft delete)',
      params: z.object({
        dealId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { dealId } = request.params as { dealId: string };
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getDealByIdUseCase = makeGetDealByIdUseCase();

        const [{ user }, { deal }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getDealByIdUseCase.execute({ id: dealId, tenantId }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeDeleteDealUseCase();
        await useCase.execute({ id: dealId, tenantId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.DEAL_DELETE,
          entityId: dealId,
          placeholders: { userName, dealTitle: deal.title },
          oldData: { id: deal.id.toString(), title: deal.title },
        });

        return reply.status(200).send({ message: 'Deal deleted successfully' });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
