import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listInvoicesQuerySchema,
  listInvoicesResponseSchema,
} from '@/http/schemas/sales/invoicing/invoicing.schema';
import { makeListInvoicesUseCase } from '@/use-cases/sales/invoicing/factories/make-invoicing-use-cases';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListInvoicesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/invoices',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.INVOICING.ACCESS,
        resource: 'invoices',
      }),
    ],
    schema: {
      tags: ['Sales - Invoicing'],
      summary: 'List invoices',
      description:
        'Lists all invoices for the tenant with pagination and optional filters',
      querystring: listInvoicesQuerySchema,
      response: {
        200: listInvoicesResponseSchema,
        400: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { status, orderId, fromDate, toDate, page, limit } = request.query;

      try {
        const useCase = makeListInvoicesUseCase();
        const result = await useCase.execute({
          tenantId,
          status,
          orderId,
          fromDate,
          toDate,
          page,
          limit,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Page must be')) {
          return reply.status(400).send({ message: error.message });
        }

        return reply.status(500).send({
          message:
            error instanceof Error ? error.message : 'Internal server error',
        });
      }
    },
  });
}
