import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  getInvoiceParamsSchema,
  invoiceDetailResponseSchema,
} from '@/http/schemas/sales/invoicing/invoicing.schema';
import { makeCheckInvoiceStatusUseCase } from '@/use-cases/sales/invoicing/factories/make-invoicing-use-cases';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetInvoiceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/invoices/:invoiceId',
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
      summary: 'Get invoice details',
      description:
        'Retrieves details of a specific invoice and checks its status',
      params: getInvoiceParamsSchema,
      response: {
        200: invoiceDetailResponseSchema,
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { invoiceId } = request.params as { invoiceId: string };

      try {
        const useCase = makeCheckInvoiceStatusUseCase();
        const result = await useCase.execute({
          invoiceId,
          tenantId,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        return reply.status(500).send({
          message:
            error instanceof Error ? error.message : 'Internal server error',
        });
      }
    },
  });
}
