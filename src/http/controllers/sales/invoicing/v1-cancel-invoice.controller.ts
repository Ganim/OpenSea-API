import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  getInvoiceParamsSchema,
  cancelInvoiceRequestSchema,
  cancelInvoiceResponseSchema,
} from '@/http/schemas/sales/invoicing/invoicing.schema';
import { makeCancelInvoiceUseCase } from '@/use-cases/sales/invoicing/factories/make-invoicing-use-cases';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CancelInvoiceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/sales/invoices/:invoiceId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.INVOICING.REMOVE,
        resource: 'invoices',
      }),
    ],
    schema: {
      tags: ['Sales - Invoicing'],
      summary: 'Cancel an issued invoice',
      description: 'Cancels an issued invoice via Focus NFe provider',
      params: getInvoiceParamsSchema,
      body: cancelInvoiceRequestSchema,
      response: {
        200: cancelInvoiceResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.id!;
      const { invoiceId } = request.params as { invoiceId: string };
      const { reason } = request.body;

      try {
        const useCase = makeCancelInvoiceUseCase();
        const result = await useCase.execute({
          invoiceId,
          tenantId,
          reason,
          userId,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply
            .status(404)
            .send({ message: error.message });
        }

        if (error instanceof BadRequestError) {
          return reply
            .status(400)
            .send({ message: error.message });
        }

        return reply.status(500).send({
          message: error instanceof Error ? error.message : 'Internal server error',
        });
      }
    },
  });
}
