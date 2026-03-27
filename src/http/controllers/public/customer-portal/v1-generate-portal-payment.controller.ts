import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { makeGeneratePortalPaymentUseCase } from '@/use-cases/finance/customer-portal/factories/make-generate-portal-payment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function generatePortalPaymentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/public/customer-portal/:token/invoices/:id/pay',
    schema: {
      tags: ['Public - Customer Portal'],
      summary: 'Generate payment data (PIX/Boleto) for a portal invoice',
      params: z.object({
        token: z.string().min(1),
        id: z.string().uuid(),
      }),
      body: z.object({
        method: z.enum(['PIX', 'BOLETO']),
      }),
      response: {
        200: z.object({
          invoiceId: z.string(),
          method: z.enum(['PIX', 'BOLETO']),
          amount: z.number(),
          pixCopiaECola: z.string().nullable(),
          pixKey: z.string().nullable(),
          boletoDigitableLine: z.string().nullable(),
          boletoPdfUrl: z.string().nullable(),
        }),
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { token, id: invoiceId } = request.params;
      const { method } = request.body;

      try {
        const useCase = makeGeneratePortalPaymentUseCase();
        const result = await useCase.execute({ token, invoiceId, method });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
