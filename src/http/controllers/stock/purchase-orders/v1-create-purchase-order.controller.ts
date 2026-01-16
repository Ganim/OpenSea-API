import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createPurchaseOrderSchema,
  purchaseOrderResponseSchema,
} from '@/http/schemas';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreatePurchaseOrderUseCase } from '@/use-cases/stock/purchase-orders/factories/make-create-purchase-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createPurchaseOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/purchase-orders',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PURCHASE_ORDERS.CREATE,
        resource: 'purchase-orders',
      }),
    ],
    schema: {
      tags: ['Stock - Purchase Orders'],
      summary: 'Create a new purchase order',
      body: createPurchaseOrderSchema,
      response: {
        201: z.object({
          purchaseOrder: purchaseOrderResponseSchema,
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
      const userId = request.user.sub;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const createPurchaseOrderUseCase = makeCreatePurchaseOrderUseCase();
        const { purchaseOrder } = await createPurchaseOrderUseCase.execute({
          ...data,
          createdBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.PURCHASE_ORDER_CREATE,
          entityId: purchaseOrder.id,
          placeholders: { userName, orderNumber: purchaseOrder.orderNumber },
          newData: {
            supplierId: data.supplierId,
            itemsCount: data.items?.length || 0,
          },
        });

        return reply.status(201).send({ purchaseOrder });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
