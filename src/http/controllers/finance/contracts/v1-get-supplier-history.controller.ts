import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';
import {
  supplierHistoryQuerySchema,
  supplierHistoryResponseSchema,
} from '@/http/schemas/finance';
import { makeGetSupplierHistoryUseCase } from '@/use-cases/finance/contracts/factories/make-get-supplier-history-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getSupplierHistoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/contracts/supplier-history',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.CONTRACTS.ACCESS,
        resource: 'contracts',
      }),
    ],
    schema: {
      tags: ['Finance - Contracts'],
      summary: 'Get supplier history (contracts + payments)',
      security: [{ bearerAuth: [] }],
      querystring: supplierHistoryQuerySchema,
      response: {
        200: supplierHistoryResponseSchema,
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { companyId, companyName } = request.query;

      try {
        const useCase = makeGetSupplierHistoryUseCase();
        const result = await useCase.execute({
          tenantId,
          companyId,
          companyName,
        });

        reply.header('Cache-Control', 'private, max-age=120');
        return reply.status(200).send(result);
      } catch (error) {
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
