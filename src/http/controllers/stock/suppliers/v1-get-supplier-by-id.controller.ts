import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { supplierResponseSchema } from '@/http/schemas/stock.schema';
import { makeGetSupplierByIdUseCase } from '@/use-cases/stock/suppliers/factories/make-get-supplier-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getSupplierByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/api/v1/suppliers/:id',
    schema: {
      tags: ['Suppliers'],
      summary: 'Get a supplier by ID',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        200: z.object({
          supplier: supplierResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeGetSupplierByIdUseCase();
        const result = await useCase.execute({ id: request.params.id });
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
