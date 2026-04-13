import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createProductionOrderSchema,
  productionOrderResponseSchema,
} from '@/http/schemas/production';
import { productionOrderToDTO } from '@/mappers/production/production-order-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateProductionOrderUseCase } from '@/use-cases/production/production-orders/factories/make-create-production-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createProductionOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/orders',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.REGISTER,
        resource: 'production-orders',
      }),
    ],
    schema: {
      tags: ['Production - Orders'],
      summary: 'Create a new production order',
      body: createProductionOrderSchema,
      response: {
        201: z.object({
          productionOrder: productionOrderResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const {
        bomId,
        productId,
        salesOrderId,
        parentOrderId,
        priority,
        quantityPlanned,
        plannedStartDate,
        plannedEndDate,
        notes,
      } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createProductionOrderUseCase = makeCreateProductionOrderUseCase();
      const { productionOrder } = await createProductionOrderUseCase.execute({
        tenantId,
        bomId,
        productId,
        salesOrderId,
        parentOrderId,
        priority,
        quantityPlanned,
        plannedStartDate,
        plannedEndDate,
        notes,
        createdById: userId,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.ORDER_CREATE,
        entityId: productionOrder.productionOrderId.toString(),
        placeholders: { userName, orderNumber: productionOrder.orderNumber },
        newData: {
          bomId,
          productId,
          priority,
          quantityPlanned,
          plannedStartDate,
          plannedEndDate,
        },
      });

      return reply
        .status(201)
        .send({ productionOrder: productionOrderToDTO(productionOrder) });
    },
  });
}
