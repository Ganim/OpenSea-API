import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateProductionOrderSchema,
  productionOrderResponseSchema,
} from '@/http/schemas/production';
import { productionOrderToDTO } from '@/mappers/production/production-order-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetProductionOrderByIdUseCase } from '@/use-cases/production/production-orders/factories/make-get-production-order-by-id-use-case';
import { makeUpdateProductionOrderUseCase } from '@/use-cases/production/production-orders/factories/make-update-production-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateProductionOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/production/orders/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.MODIFY,
        resource: 'production-orders',
      }),
    ],
    schema: {
      tags: ['Production - Orders'],
      summary: 'Update a production order',
      params: z.object({
        id: z.string(),
      }),
      body: updateProductionOrderSchema,
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
      const {
        priority,
        quantityPlanned,
        plannedStartDate,
        plannedEndDate,
        notes,
      } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const getProductionOrderByIdUseCase = makeGetProductionOrderByIdUseCase();

      const [{ user }, { productionOrder: oldOrder }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getProductionOrderByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateProductionOrderUseCase = makeUpdateProductionOrderUseCase();
      const { productionOrder } = await updateProductionOrderUseCase.execute({
        tenantId,
        id,
        priority,
        quantityPlanned,
        plannedStartDate,
        plannedEndDate,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.ORDER_UPDATE,
        entityId: productionOrder.productionOrderId.toString(),
        placeholders: { userName, orderNumber: productionOrder.orderNumber },
        oldData: {
          priority: oldOrder.priority,
          quantityPlanned: oldOrder.quantityPlanned,
        },
        newData: {
          priority,
          quantityPlanned,
          plannedStartDate,
          plannedEndDate,
          notes,
        },
      });

      return reply
        .status(200)
        .send({ productionOrder: productionOrderToDTO(productionOrder) });
    },
  });
}
