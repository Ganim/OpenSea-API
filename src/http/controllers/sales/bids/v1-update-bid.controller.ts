import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bidResponseSchema, updateBidSchema } from '@/http/schemas/sales/bids';
import { makeGetBidByIdUseCase } from '@/use-cases/sales/bids/factories/make-get-bid-by-id-use-case';
import { makeUpdateBidUseCase } from '@/use-cases/sales/bids/factories/make-update-bid-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateBidController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/bids/:bidId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BIDS.MODIFY,
        resource: 'bids',
      }),
    ],
    schema: {
      tags: ['Sales - Bids'],
      summary: 'Update a bid',
      params: z.object({
        bidId: z.string().uuid().describe('Bid UUID'),
      }),
      body: updateBidSchema,
      response: {
        200: z.object({ bid: bidResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { bidId } = request.params;
      const body = request.body;

      const getBidUseCase = makeGetBidByIdUseCase();
      const { bid: oldBid } = await getBidUseCase.execute({
        id: bidId,
        tenantId,
      });

      const useCase = makeUpdateBidUseCase();
      const { bid } = await useCase.execute({ id: bidId, tenantId, ...body });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BID_UPDATE,
        entityId: bid.id.toString(),
        placeholders: { userName: userId, bidTitle: bid.title },
        oldData: { title: oldBid.title, agency: oldBid.agency },
        newData: { title: body.title, agency: body.agency },
      });

      return reply.status(200).send({ bid });
    },
  });
}
