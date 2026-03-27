import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { makeGetPortalInvoiceUseCase } from '@/use-cases/finance/customer-portal/factories/make-get-portal-invoice-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getPortalInvoiceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/public/customer-portal/:token/invoices/:id',
    schema: {
      tags: ['Public - Customer Portal'],
      summary: 'Get a specific invoice from the customer portal',
      params: z.object({
        token: z.string().min(1),
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          invoice: z.object({
            id: z.string(),
            code: z.string(),
            description: z.string(),
            expectedAmount: z.number(),
            actualAmount: z.number().nullable(),
            discount: z.number(),
            interest: z.number(),
            penalty: z.number(),
            dueDate: z.string(),
            issueDate: z.string(),
            paymentDate: z.string().nullable(),
            status: z.string(),
            pixKey: z.string().nullable(),
            boletoDigitableLine: z.string().nullable(),
            boletoPdfUrl: z.string().nullable(),
          }),
          customerName: z.string(),
        }),
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { token, id: invoiceId } = request.params;

      try {
        const useCase = makeGetPortalInvoiceUseCase();
        const { invoice, customerName } = await useCase.execute({
          token,
          invoiceId,
        });

        return reply.status(200).send({
          invoice: {
            id: invoice.id.toString(),
            code: invoice.code,
            description: invoice.description,
            expectedAmount: invoice.expectedAmount,
            actualAmount: invoice.actualAmount ?? null,
            discount: invoice.discount,
            interest: invoice.interest,
            penalty: invoice.penalty,
            dueDate: invoice.dueDate.toISOString(),
            issueDate: invoice.issueDate.toISOString(),
            paymentDate: invoice.paymentDate?.toISOString() ?? null,
            status: invoice.status,
            pixKey: invoice.pixKey ?? null,
            boletoDigitableLine: invoice.boletoDigitableLine ?? null,
            boletoPdfUrl: invoice.boletoPdfUrl ?? null,
          },
          customerName,
        });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
