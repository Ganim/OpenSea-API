import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';
import {
  lastSupplierEntryQuerySchema,
  lastSupplierEntryResponseSchema,
} from '@/http/schemas/finance';
import { makeGetLastSupplierEntryUseCase } from '@/use-cases/finance/entries/factories/make-get-last-supplier-entry';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getLastSupplierEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/entries/last-supplier',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.REGISTER,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary:
        'Get last entry data for a supplier (category, cost center suggestion)',
      security: [{ bearerAuth: [] }],
      querystring: lastSupplierEntryQuerySchema,
      response: {
        200: z.object({ suggestion: lastSupplierEntryResponseSchema }),
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { supplierName } = request.query as { supplierName: string };
      const tenantId = request.user.tenantId!;

      const useCase = makeGetLastSupplierEntryUseCase();
      const result = await useCase.execute({ tenantId, supplierName });

      return reply.status(200).send({ suggestion: result });
    },
  });
}
