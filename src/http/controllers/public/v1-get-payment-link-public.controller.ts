import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeGetPaymentLinkPublicUseCase } from '@/use-cases/finance/payment-links/factories/make-get-payment-link-public-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getPaymentLinkPublicController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pay/:slug',
    schema: {
      tags: ['Public - Payment Links'],
      summary: 'Get payment link details (public, no auth)',
      params: z.object({
        slug: z.string().min(1).max(32),
      }),
      response: {
        200: z.object({
          paymentLink: z.object({
            id: z.string(),
            slug: z.string(),
            amount: z.number(),
            description: z.string(),
            customerName: z.string().nullable(),
            status: z.string(),
            expiresAt: z.string().nullable(),
            pixCopiaECola: z.string().nullable(),
            boletoDigitableLine: z.string().nullable(),
            boletoPdfUrl: z.string().nullable(),
            paidAt: z.string().nullable(),
            createdAt: z.string(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { slug } = request.params;

      try {
        const useCase = makeGetPaymentLinkPublicUseCase();
        const result = await useCase.execute({ slug });

        return reply.status(200).send({
          paymentLink: {
            id: result.paymentLink.id,
            slug: result.paymentLink.slug,
            amount: result.paymentLink.amount,
            description: result.paymentLink.description,
            customerName: result.paymentLink.customerName,
            status: result.paymentLink.status,
            expiresAt: result.paymentLink.expiresAt?.toISOString() ?? null,
            pixCopiaECola: result.paymentLink.pixCopiaECola,
            boletoDigitableLine: result.paymentLink.boletoDigitableLine,
            boletoPdfUrl: result.paymentLink.boletoPdfUrl,
            paidAt: result.paymentLink.paidAt?.toISOString() ?? null,
            createdAt: result.paymentLink.createdAt.toISOString(),
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
