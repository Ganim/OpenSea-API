import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  salesOrderResponseSchema,
  updateSalesOrderStatusSchema,
} from '@/http/schemas/sales.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetSalesOrderByIdUseCase } from '@/use-cases/sales/sales-orders/factories/make-get-sales-order-by-id-use-case';
import { makeUpdateSalesOrderStatusUseCase } from '@/use-cases/sales/sales-orders/factories/make-update-sales-order-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1UpdateSalesOrderStatusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales-orders/:id/status',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ORDERS.MANAGE,
        resource: 'sales-orders',
      }),
    ],
    schema: {
      tags: ['Sales - Orders'],
      summary: 'Update sales order status',
      params: z.object({ id: z.string().uuid() }),
      body: updateSalesOrderStatusSchema,
      response: {
        200: z.object({ salesOrder: salesOrderResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.sub;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getSalesOrderByIdUseCase = makeGetSalesOrderByIdUseCase();

        const [{ user }, { salesOrder: oldOrder }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getSalesOrderByIdUseCase.execute({ id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateSalesOrderStatusUseCase();
        const { salesOrder } = await useCase.execute({ id, ...data });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.ORDER_STATUS_CHANGE,
          entityId: id,
          placeholders: {
            userName,
            orderNumber: salesOrder.orderNumber || id,
            oldStatus: oldOrder.status,
            newStatus: salesOrder.status,
          },
          oldData: { status: oldOrder.status },
          newData: { status: data.status },
        });

        return reply.status(200).send({ salesOrder });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
