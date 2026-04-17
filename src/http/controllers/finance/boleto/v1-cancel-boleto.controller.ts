import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCancelBoletoUseCase } from '@/use-cases/finance/boleto/factories/make-cancel-boleto-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

export async function cancelBoletoController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/finance/boleto/:nossoNumero',
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
      summary: 'Cancel a boleto by nossoNumero',
      security: [{ bearerAuth: [] }],
      params: z.object({ nossoNumero: z.string().min(1) }),
      body: z.object({
        entryId: z.string().uuid(),
        bankAccountId: z.string().uuid(),
      }),
      response: {
        204: z.void(),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { nossoNumero: _nossoNumero } = request.params as {
        nossoNumero: string;
      };
      const { entryId, bankAccountId } = request.body;

      try {
        const useCase = makeCancelBoletoUseCase();
        await useCase.execute({
          tenantId,
          entryId,
          bankAccountId,
        });

        return reply.status(204).send();
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
