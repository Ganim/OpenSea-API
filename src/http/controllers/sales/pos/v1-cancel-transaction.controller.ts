import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const cancelTransactionBodySchema = z.object({
  reason: z.string().min(1).max(500),
});

export async function cancelTransactionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/transactions/:transactionId/cancel',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.CANCEL,
        resource: 'pos-transactions',
      }),
    ],
    schema: {
      tags: ['Sales - POS'],
      summary: 'Cancel a POS transaction',
      params: z.object({
        transactionId: z.string().uuid().describe('Transaction UUID'),
      }),
      body: cancelTransactionBodySchema,
      response: {
        200: z.object({
          transaction: z.object({
            id: z.string().uuid(),
            status: z.string(),
            cancelledAt: z.string(),
            cancelReason: z.string(),
          }),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { transactionId } = request.params;
      const { reason } = request.body;

      // TODO: Replace stub with real use case
      const transaction = {
        id: transactionId,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
        cancelReason: reason,
      };

      await logAudit(request, {
        message: 'POS transaction cancelled: {transactionId}',
        entityId: transactionId,
        placeholders: { userName: userId, transactionId },
        newData: { reason },
      });

      return reply.status(200).send({ transaction });
    },
  });
}
