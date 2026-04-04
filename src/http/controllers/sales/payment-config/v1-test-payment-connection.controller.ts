import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeTestPaymentConnectionUseCase } from '@/use-cases/sales/payment/factories/make-test-payment-connection-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const testPaymentConnectionBodySchema = z.object({
  target: z.enum(['primary', 'fallback']),
});

export async function v1TestPaymentConnectionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/payment-config/test',
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
      summary: 'Test connection to a payment gateway provider',
      body: testPaymentConnectionBodySchema,
      response: {
        200: z.object({
          ok: z.boolean(),
          message: z.string(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { target } = request.body;

      try {
        const useCase = makeTestPaymentConnectionUseCase();
        const connectionTestResult = await useCase.execute({
          tenantId,
          slot: target,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PAYMENT_CONNECTION_TESTED,
          entityId: tenantId,
          placeholders: {
            userName: userId,
            slot: target,
            result: connectionTestResult.ok ? 'success' : 'failure',
          },
          newData: { target, ok: connectionTestResult.ok },
        });

        return reply.send(connectionTestResult);
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
