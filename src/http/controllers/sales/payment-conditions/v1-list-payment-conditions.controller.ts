import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paymentConditionResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import { paymentConditionToDTO } from '@/mappers/sales/payment-condition/payment-condition-to-dto';
import { makeListPaymentConditionsUseCase } from '@/use-cases/sales/payment-conditions/factories/make-list-payment-conditions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListPaymentConditionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/payment-conditions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ORDERS.ACCESS,
        resource: 'payment-conditions',
      }),
    ],
    schema: {
      tags: ['Payment Conditions'],
      summary: 'List payment conditions',
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        type: z.string().optional(),
        isActive: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(paymentConditionResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListPaymentConditionsUseCase();
      const result = await useCase.execute({
        tenantId,
        ...request.query,
      });

      return reply.send({
        data: result.paymentConditions.map(paymentConditionToDTO),
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.totalPages,
        },
      });
    },
  });
}
