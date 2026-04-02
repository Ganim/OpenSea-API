import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { makeListPortalInvoicesUseCase } from '@/use-cases/finance/customer-portal/factories/make-list-portal-invoices-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const invoiceSchema = z.object({
  id: z.string(),
  code: z.string(),
  description: z.string(),
  expectedAmount: z.number(),
  actualAmount: z.number().nullable(),
  dueDate: z.string(),
  paymentDate: z.string().nullable(),
  status: z.string(),
  pixKey: z.string().nullable(),
  boletoDigitableLine: z.string().nullable(),
  boletoPdfUrl: z.string().nullable(),
});

export async function listPortalInvoicesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/public/customer-portal/:token/invoices',
    schema: {
      tags: ['Public - Customer Portal'],
      summary: 'List invoices for a customer portal token',
      params: z.object({
        token: z.string().min(1),
      }),
      querystring: z.object({
        status: z.enum(['pending', 'paid', 'all']).optional().default('all'),
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .default(20),
      }),
      response: {
        200: z.object({
          invoices: z.array(invoiceSchema),
          total: z.number(),
          customerName: z.string(),
        }),
        401: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { token } = request.params;
      const { status, page, limit } = request.query;

      try {
        const useCase = makeListPortalInvoicesUseCase();
        const { invoices, total, customerName } = await useCase.execute({
          token,
          status,
          page,
          limit,
        });

        return reply.status(200).send({
          invoices: invoices.map((invoice) => ({
            id: invoice.id.toString(),
            code: invoice.code,
            description: invoice.description,
            expectedAmount: invoice.expectedAmount,
            actualAmount: invoice.actualAmount ?? null,
            dueDate: invoice.dueDate.toISOString(),
            paymentDate: invoice.paymentDate?.toISOString() ?? null,
            status: invoice.status,
            pixKey: invoice.pixKey ?? null,
            boletoDigitableLine: invoice.boletoDigitableLine ?? null,
            boletoPdfUrl: invoice.boletoPdfUrl ?? null,
          })),
          total,
          customerName,
        });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
