import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreatePixChargeUseCase } from '@/use-cases/finance/pix/factories/make-create-pix-charge-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

const pixChargeResultSchema = z.object({
  txId: z.string(),
  status: z.string(),
  pixCopyPaste: z.string(),
  qrCodeBase64: z.string().optional(),
  amount: z.number(),
  createdAt: z.string(),
});

export async function createPixChargeBankingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/pix/charge',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BOLETO.REGISTER,
        resource: 'pix',
      }),
    ],
    schema: {
      tags: ['Finance - PIX'],
      summary: 'Create a PIX charge for a receivable entry via banking API',
      security: [{ bearerAuth: [] }],
      body: z.object({
        entryId: z.string().uuid(),
        bankAccountId: z.string().uuid(),
        expiresInSeconds: z.number().int().positive().optional(),
      }),
      response: {
        201: z.object({ pixCharge: pixChargeResultSchema }),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeCreatePixChargeUseCase();
        const result = await useCase.execute({
          tenantId,
          ...request.body,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            code: error.code ?? ErrorCodes.BAD_REQUEST,
            message: error.message,
            requestId: request.requestId,
          });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
