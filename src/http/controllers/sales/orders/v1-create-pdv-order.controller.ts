import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { orderResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import { orderToDTO } from '@/mappers/sales/order/order-to-dto';
import { makeCreatePdvOrderUseCase } from '@/use-cases/sales/orders/factories/make-create-pdv-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CreatePdvOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/orders/pdv',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.SELL,
        resource: 'orders',
      }),
    ],
    schema: {
      tags: ['PDV'],
      summary: 'Create a new PDV order',
      body: z.object({
        customerId: z.string().uuid().optional(),
        terminalId: z.string().uuid().optional(),
      }),
      response: {
        201: z.object({ order: orderResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { customerId, terminalId } = request.body;

      try {
        const useCase = makeCreatePdvOrderUseCase();
        const result = await useCase.execute({
          tenantId,
          assignedToUserId: userId,
          customerId,
          terminalId,
        });

        const dto = orderToDTO(result.order);

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PDV_ORDER_CREATED,
          entityId: result.order.id.toString(),
          placeholders: {
            userName: userId,
            saleCode: result.order.saleCode ?? '',
          },
          newData: { customerId, terminalId },
        });

        return reply.status(201).send({ order: dto });
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
