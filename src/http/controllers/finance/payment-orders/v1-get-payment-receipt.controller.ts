import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGeneratePaymentReceiptUseCase } from '@/use-cases/finance/payment-orders/factories/make-generate-payment-receipt-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

export async function getPaymentReceiptController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/payment-orders/:id/receipt',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.PAYMENT_ORDERS.ACCESS,
        resource: 'payment-orders',
      }),
    ],
    schema: {
      tags: ['Finance - Payment Orders'],
      summary:
        'Generate or retrieve the PDF receipt for a completed payment order',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          receiptFileId: z.string(),
          receiptUrl: z.string().url(),
        }),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const useCase = makeGeneratePaymentReceiptUseCase();
        const result = await useCase.execute({ orderId: id, tenantId });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
            message: error.message,
            requestId: request.requestId,
          });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            code: error.code ?? ErrorCodes.BAD_REQUEST,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
