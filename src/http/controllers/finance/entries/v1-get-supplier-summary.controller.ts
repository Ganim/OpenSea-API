import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  supplierSummaryQuerySchema,
  supplierSummaryResponseSchema,
} from '@/http/schemas/finance';
import { makeGetSupplierSummaryUseCase } from '@/use-cases/finance/entries/factories/make-get-supplier-summary-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getSupplierSummaryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/entries/supplier-summary',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Get supplier/customer financial summary with trends',
      description:
        'Aggregates financial data for a specific supplier or customer, including totals, monthly trends, and recent entries.',
      security: [{ bearerAuth: [] }],
      querystring: supplierSummaryQuerySchema,
      response: {
        200: z.object({ summary: supplierSummaryResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { supplierName, supplierId, customerName, customerId } =
        request.query as {
          supplierName?: string;
          supplierId?: string;
          customerName?: string;
          customerId?: string;
        };

      const tenantId = request.user.tenantId!;

      const useCase = makeGetSupplierSummaryUseCase();
      const summary = await useCase.execute({
        tenantId,
        supplierName,
        supplierId,
        customerName,
        customerId,
      });

      return reply.status(200).send({ summary });
    },
  });
}
