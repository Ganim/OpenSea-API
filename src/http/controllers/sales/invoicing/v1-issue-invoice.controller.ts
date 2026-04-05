import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  issueInvoiceRequestSchema,
  issueInvoiceResponseSchema,
} from '@/http/schemas/sales/invoicing/invoicing.schema';
import { makeIssueInvoiceUseCase } from '@/use-cases/sales/invoicing/factories/make-invoicing-use-cases';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1IssueInvoiceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/orders/:orderId/invoice',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.INVOICING.REGISTER,
        resource: 'invoices',
      }),
    ],
    schema: {
      tags: ['Sales - Invoicing'],
      summary: 'Issue a NFC-e or NF-e for a confirmed order',
      description: 'Creates and issues an invoice for a confirmed order via Focus NFe provider',
      params: z.object({
        orderId: z.string().uuid(),
      }),
      body: issueInvoiceRequestSchema,
      response: {
        201: issueInvoiceResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        500: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.id!;
      const { orderId } = request.params as { orderId: string };
      const { invoiceType } = request.body;

      try {
        const useCase = makeIssueInvoiceUseCase();
        const result = await useCase.execute({
          orderId,
          tenantId,
          userId,
          invoiceType: (invoiceType as 'NFE' | 'NFCE') || 'NFCE',
        });

        return reply.status(201).send(result);
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
