import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetBoletoUseCase } from '@/use-cases/finance/boleto/factories/make-get-boleto-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

const boletoResultSchema = z.object({
  nossoNumero: z.string(),
  barcode: z.string(),
  digitableLine: z.string(),
  pdfUrl: z.string().nullable().optional(),
  dueDate: z.string(),
  amount: z.number(),
});

export async function getBoletoController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/boleto/:nossoNumero',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BOLETO.ACCESS,
        resource: 'boleto',
      }),
    ],
    schema: {
      tags: ['Finance - Boleto'],
      summary: 'Get boleto details by nossoNumero',
      security: [{ bearerAuth: [] }],
      params: z.object({ nossoNumero: z.string().min(1) }),
      querystring: z.object({
        bankAccountId: z.string().uuid(),
      }),
      response: {
        200: z.object({ boleto: boletoResultSchema }),
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { nossoNumero } = request.params as { nossoNumero: string };
      const { bankAccountId } = request.query;

      try {
        const useCase = makeGetBoletoUseCase();
        const result = await useCase.execute({ nossoNumero, bankAccountId });

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
