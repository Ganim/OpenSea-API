import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createPaymentConditionSchema,
  paymentConditionResponseSchema,
} from '@/http/schemas/sales/orders/order.schema';
import { paymentConditionToDTO } from '@/mappers/sales/payment-condition/payment-condition-to-dto';
import { makeCreatePaymentConditionUseCase } from '@/use-cases/sales/payment-conditions/factories/make-create-payment-condition-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CreatePaymentConditionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/payment-conditions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ORDERS.ADMIN,
        resource: 'payment-conditions',
      }),
    ],
    schema: {
      tags: ['Payment Conditions'],
      summary: 'Create a payment condition',
      body: createPaymentConditionSchema,
      response: {
        201: z.object({
          paymentCondition: paymentConditionResponseSchema,
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeCreatePaymentConditionUseCase();
      const result = await useCase.execute({ tenantId, ...request.body });

      return reply.status(201).send({
        paymentCondition: paymentConditionToDTO(result.paymentCondition),
      });
    },
  });
}
