import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { productionOrderResponseSchema } from '@/http/schemas/production';
import { productionOrderToDTO } from '@/mappers/production/production-order-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeChangeProductionOrderStatusUseCase } from '@/use-cases/production/production-orders/factories/make-change-production-order-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function changeProductionOrderStatusController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/orders/:id/change-status',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.ADMIN,
        resource: 'production-orders',
      }),
    ],
    schema: {
      tags: ['Production - Orders'],
      summary: 'Change a production order status',
      params: z.object({
        id: z.string(),
      }),
      body: z.object({
        targetStatus: z.enum([
          'PLANNED',
          'FIRM',
          'RELEASED',
          'IN_PROCESS',
          'TECHNICALLY_COMPLETE',
          'CLOSED',
        ]),
      }),
      response: {
        200: z.object({
          productionOrder: productionOrderResponseSchema,
        }),
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
      const { targetStatus } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const changeStatusUseCase = makeChangeProductionOrderStatusUseCase();
      const { productionOrder, fromStatus, toStatus } =
        await changeStatusUseCase.execute({
          tenantId,
          id,
          targetStatus,
          userId,
        });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.ORDER_STATUS_CHANGE,
        entityId: productionOrder.productionOrderId.toString(),
        placeholders: {
          userName,
          orderNumber: productionOrder.orderNumber,
          fromStatus,
          toStatus,
        },
        oldData: { status: fromStatus },
        newData: { status: toStatus },
      });

      return reply
        .status(200)
        .send({ productionOrder: productionOrderToDTO(productionOrder) });
    },
  });
}
