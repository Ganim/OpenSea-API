import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetProductionOrderByIdUseCase } from '@/use-cases/production/production-orders/factories/make-get-production-order-by-id-use-case';
import { makeCancelProductionOrderUseCase } from '@/use-cases/production/production-orders/factories/make-cancel-production-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function cancelProductionOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/orders/:id/cancel',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.REMOVE,
        resource: 'production-orders',
      }),
    ],
    schema: {
      tags: ['Production - Orders'],
      summary: 'Cancel a production order',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('Production order cancelled successfully'),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const getProductionOrderByIdUseCase = makeGetProductionOrderByIdUseCase();

      const [{ user }, { productionOrder }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getProductionOrderByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const cancelProductionOrderUseCase = makeCancelProductionOrderUseCase();
      await cancelProductionOrderUseCase.execute({ tenantId, id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.ORDER_CANCEL,
        entityId: id,
        placeholders: { userName, orderNumber: productionOrder.orderNumber },
        oldData: { status: productionOrder.status },
      });

      return reply.status(204).send(null);
    },
  });
}
