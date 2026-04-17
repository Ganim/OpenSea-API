import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetPixChargeUseCase } from '@/use-cases/finance/pix/factories/make-get-pix-charge-use-case';
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

export async function getPixChargeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/pix/charge/:txId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BOLETO.ACCESS,
        resource: 'pix',
      }),
    ],
    schema: {
      tags: ['Finance - PIX'],
      summary: 'Get PIX charge status by txId',
      security: [{ bearerAuth: [] }],
      params: z.object({ txId: z.string().min(1) }),
      querystring: z.object({
        bankAccountId: z.string().uuid(),
      }),
      response: {
        200: z.object({ pixCharge: pixChargeResultSchema }),
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { txId } = request.params as { txId: string };
      const { bankAccountId } = request.query;

      try {
        const useCase = makeGetPixChargeUseCase();
        const result = await useCase.execute({ txId, bankAccountId });

        return reply.status(200).send(result);
      } catch (error) {
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
