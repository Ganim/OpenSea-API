import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeletePaymentConditionUseCase } from '@/use-cases/sales/payment-conditions/factories/make-delete-payment-condition-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1DeletePaymentConditionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
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
      summary: 'Delete a payment condition',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeDeletePaymentConditionUseCase();
        await useCase.execute({ id, tenantId });

        return reply.status(204).send(null);
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
