import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createSalesOrderSchema,
  salesOrderResponseSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateSalesOrderUseCase } from '@/use-cases/sales/sales-orders/factories/make-create-sales-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CreateSalesOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales-orders',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ORDERS.CREATE,
        resource: 'sales-orders',
      }),
    ],
    schema: {
      tags: ['Sales - Orders'],
      summary: 'Create a new sales order',
      body: createSalesOrderSchema,
      response: {
        201: z.object({ salesOrder: salesOrderResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateSalesOrderUseCase();
        const { salesOrder } = await useCase.execute(data);

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.ORDER_CREATE,
          entityId: salesOrder.id,
          placeholders: {
            userName,
            orderNumber: salesOrder.orderNumber || salesOrder.id,
            customerName: salesOrder.customerId || 'Cliente',
          },
          newData: { customerId: data.customerId, items: data.items },
        });

        return reply.status(201).send({ salesOrder });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
