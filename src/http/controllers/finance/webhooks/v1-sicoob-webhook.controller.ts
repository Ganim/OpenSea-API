import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeProcessBankWebhookUseCase } from '@/use-cases/finance/webhooks/factories/make-process-bank-webhook-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function sicoobWebhookController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/webhooks/sicoob',
    // No auth middleware — Sicoob calls this endpoint directly
    schema: {
      tags: ['Finance - Webhooks'],
      summary: 'Receive Sicoob bank webhook events (PIX received, boleto paid)',
      querystring: z.object({
        bankAccountId: z.string().uuid(),
      }),
      body: z.record(z.string(), z.unknown()),
      response: {
        200: z.object({
          received: z.boolean(),
          matched: z.boolean(),
          autoSettled: z.boolean(),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { bankAccountId } = request.query;
      const payload = request.body;

      // tenantId must be resolved from the bank account in the use case
      // We look up the bank account's tenantId by querying the repository
      // For webhooks, we pass bankAccountId and resolve tenantId inside the use case factory
      const { prisma } = await import('@/lib/prisma');
      const bankAccount = await prisma.bankAccount.findUnique({
        where: { id: bankAccountId },
        select: { tenantId: true },
      });

      if (!bankAccount) {
        return reply.status(404).send({ message: 'Bank account not found' });
      }

      try {
        const useCase = makeProcessBankWebhookUseCase();
        const result = await useCase.execute({
          tenantId: bankAccount.tenantId,
          bankAccountId,
          provider: 'SICOOB',
          payload,
        });

        return reply.status(200).send({
          received: true,
          matched: result.matched,
          autoSettled: result.autoSettled,
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
