import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetPaymentConfigUseCase } from '@/use-cases/sales/payment/factories/make-get-payment-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const paymentConfigResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  primaryProvider: z.string(),
  primaryActive: z.boolean(),
  primaryTestedAt: z.string().datetime().nullable(),
  fallbackProvider: z.string().nullable(),
  fallbackActive: z.boolean(),
  fallbackTestedAt: z.string().datetime().nullable(),
  isConfigured: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export async function v1GetPaymentConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/payment-config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.ADMIN,
        resource: 'payment-config',
      }),
    ],
    schema: {
      tags: ['Payment Gateway'],
      summary: 'Get payment gateway configuration for the current tenant',
      response: {
        200: z.object({
          paymentConfig: paymentConfigResponseSchema.nullable(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetPaymentConfigUseCase();
      const { paymentConfig } = await useCase.execute({ tenantId });

      return reply.send({ paymentConfig });
    },
  });
}
