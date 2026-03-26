import { verifyAccountant } from '@/http/middlewares/finance/verify-accountant';
import { makeGetAccountantDataUseCase } from '@/use-cases/finance/accountant/factories/make-get-accountant-data-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getAccountantDataController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/accountant/data',
    preHandler: [verifyAccountant],
    schema: {
      tags: ['Accountant Portal'],
      summary: 'Get read-only financial data for a period',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        year: z.coerce.number().int().min(2000).max(2100),
        month: z.coerce.number().int().min(1).max(12),
      }),
    },
    handler: async (request, reply) => {
      const { year, month } = request.query as { year: number; month: number };

      const useCase = makeGetAccountantDataUseCase();
      const result = await useCase.execute({
        accessToken: request.headers.authorization!.slice(7),
        year,
        month,
      });

      return reply.status(200).send(result);
    },
  });
}
