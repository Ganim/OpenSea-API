import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updatePaymentConditionSchema,
  paymentConditionResponseSchema,
} from '@/http/schemas/sales/orders/order.schema';
import { paymentConditionToDTO } from '@/mappers/sales/payment-condition/payment-condition-to-dto';
import { makeUpdatePaymentConditionUseCase } from '@/use-cases/sales/payment-conditions/factories/make-update-payment-condition-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1UpdatePaymentConditionController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/payment-conditions/:id',
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
      summary: 'Update a payment condition',
      params: z.object({ id: z.string().uuid() }),
      body: updatePaymentConditionSchema,
      response: {
        200: z.object({
          paymentCondition: paymentConditionResponseSchema,
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeUpdatePaymentConditionUseCase();
        const result = await useCase.execute({
          id,
          tenantId,
          ...request.body,
        });

        return reply.send({
          paymentCondition: paymentConditionToDTO(result.paymentCondition),
        });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
