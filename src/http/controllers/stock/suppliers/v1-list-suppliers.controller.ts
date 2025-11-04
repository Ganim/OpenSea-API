import { supplierResponseSchema } from '@/http/schemas/stock.schema';
import { makeListSuppliersUseCase } from '@/use-cases/stock/suppliers/factories/make-list-suppliers-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listSuppliersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/suppliers',
    schema: {
      tags: ['Suppliers'],
      summary: 'List all suppliers',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          suppliers: z.array(supplierResponseSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const useCase = makeListSuppliersUseCase();
      const result = await useCase.execute();
      return reply.status(200).send(result);
    },
  });
}
