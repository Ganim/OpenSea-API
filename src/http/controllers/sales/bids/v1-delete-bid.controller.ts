import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteBidUseCase } from '@/use-cases/sales/bids/factories/make-delete-bid-use-case';
import { makeGetBidByIdUseCase } from '@/use-cases/sales/bids/factories/make-get-bid-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteBidController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/bids/:bidId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BIDS.REMOVE,
        resource: 'bids',
      }),
    ],
    schema: {
      tags: ['Sales - Bids'],
      summary: 'Delete a bid',
      params: z.object({
        bidId: z.string().uuid().describe('Bid UUID'),
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
      const { bidId } = request.params;

      const getBidUseCase = makeGetBidByIdUseCase();
      const { bid } = await getBidUseCase.execute({ id: bidId, tenantId });

      const useCase = makeDeleteBidUseCase();
      await useCase.execute({ id: bidId, tenantId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BID_DELETE,
        entityId: bidId,
        placeholders: { userName: userId, bidTitle: bid.title },
        oldData: { id: bid.id.toString(), title: bid.title, agency: bid.agency },
      });

      return reply.status(204).send(null);
    },
  });
}
