import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCheckChargeStatusUseCase } from '@/use-cases/sales/payment/factories/make-check-charge-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const chargeStatusResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  orderId: z.string(),
  provider: z.string(),
  providerChargeId: z.string().nullable().optional(),
  method: z.string(),
  amount: z.number(),
  status: z.string(),
  qrCode: z.string().nullable().optional(),
  checkoutUrl: z.string().nullable().optional(),
  boletoUrl: z.string().nullable().optional(),
  boletoBarcode: z.string().nullable().optional(),
  paidAt: z.string().datetime().nullable().optional(),
  paidAmount: z.number().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export async function v1CheckChargeStatusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/payments/charges/:id/status',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.RECEIVE,
        resource: 'payment-charges',
      }),
    ],
    schema: {
      tags: ['Payment Gateway'],
      summary: 'Check the status of a payment charge (polling endpoint)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          paymentCharge: chargeStatusResponseSchema,
          changed: z.boolean(),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: chargeId } = request.params;

      try {
        const useCase = makeCheckChargeStatusUseCase();
        const chargeStatusResult = await useCase.execute({
          tenantId,
          chargeId,
        });

        return reply.send(chargeStatusResult);
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
