import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteSupplierUseCase } from '@/use-cases/stock/suppliers/factories/make-delete-supplier-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteSupplierController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/suppliers/:id',
    schema: {
      tags: ['Suppliers'],
      summary: 'Delete a supplier',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        204: z.null().describe('Supplier deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeDeleteSupplierUseCase();
        await useCase.execute({ id: request.params.id });
        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
