import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bidResponseSchema, changeBidStatusSchema } from '@/http/schemas/sales/bids';
import { makeChangeBidStatusUseCase } from '@/use-cases/sales/bids/factories/make-change-bid-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function changeBidStatusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/bids/:bidId/status',
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
      summary: 'Change bid status',
      params: z.object({
        bidId: z.string().uuid().describe('Bid UUID'),
      }),
      body: changeBidStatusSchema,
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
      const { status, reason } = request.body;

      const useCase = makeChangeBidStatusUseCase();
      const { bid } = await useCase.execute({ id: bidId, tenantId, status, reason });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BID_STATUS_CHANGE,
        entityId: bid.id.toString(),
        placeholders: { userName: userId, bidTitle: bid.title, newStatus: status },
        newData: { status, reason },
      });

      return reply.status(200).send({ bid });
    },
  });
}
