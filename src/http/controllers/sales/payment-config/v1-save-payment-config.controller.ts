import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeSavePaymentConfigUseCase } from '@/use-cases/sales/payment/factories/make-save-payment-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const savePaymentConfigBodySchema = z.object({
  primaryProvider: z.string().min(1),
  primaryConfig: z.record(z.string(), z.unknown()),
  primaryActive: z.boolean(),
  fallbackProvider: z.string().optional(),
  fallbackConfig: z.record(z.string(), z.unknown()).optional(),
  fallbackActive: z.boolean().optional(),
});

export async function v1SavePaymentConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
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
      summary: 'Save or update payment gateway configuration',
      body: savePaymentConfigBodySchema,
      response: {
        200: z.object({
          paymentConfig: z.object({
            id: z.string(),
            tenantId: z.string(),
            primaryProvider: z.string(),
            primaryActive: z.boolean(),
            isConfigured: z.boolean(),
          }),
        }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const {
        primaryProvider,
        primaryConfig,
        primaryActive,
        fallbackProvider,
        fallbackConfig,
        fallbackActive,
      } = request.body;

      try {
        const useCase = makeSavePaymentConfigUseCase();
        const { paymentConfig } = await useCase.execute({
          tenantId,
          primaryProvider,
          primaryConfig,
          primaryActive,
          fallbackProvider,
          fallbackConfig,
          fallbackActive,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PAYMENT_CONFIG_SAVED,
          entityId: paymentConfig.id,
          placeholders: {
            userName: userId,
            primaryProvider,
          },
          newData: {
            primaryProvider,
            primaryActive,
            fallbackProvider,
            fallbackActive,
          },
        });

        return reply.send({ paymentConfig });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
