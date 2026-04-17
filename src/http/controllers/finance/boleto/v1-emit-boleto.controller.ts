import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeEmitBoletoUseCase } from '@/use-cases/finance/boleto/factories/make-emit-boleto-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

const emitBoletoBodySchema = z.object({
  entryId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  isHybrid: z.boolean().optional(),
});

const boletoResultSchema = z.object({
  nossoNumero: z.string(),
  barcode: z.string(),
  digitableLine: z.string(),
  pdfUrl: z.string().nullable().optional(),
  dueDate: z.string(),
  amount: z.number(),
});

export async function emitBoletoController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/boleto/emit',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BOLETO.REGISTER,
        resource: 'boleto',
      }),
    ],
    schema: {
      tags: ['Finance - Boleto'],
      summary: 'Emit a registered boleto for a receivable entry',
      security: [{ bearerAuth: [] }],
      body: emitBoletoBodySchema,
      response: {
        201: z.object({ boleto: boletoResultSchema }),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeEmitBoletoUseCase();
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
