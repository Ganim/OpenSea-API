import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  supplierResponseSchema,
  updateSupplierSchema,
} from '@/http/schemas/stock.schema';
import { makeUpdateSupplierUseCase } from '@/use-cases/stock/suppliers/factories/make-update-supplier-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateSupplierController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/suppliers/:id',
    schema: {
      tags: ['Suppliers'],
      summary: 'Update a supplier',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.uuid(),
      }),
      body: updateSupplierSchema,
      response: {
        200: z.object({
          supplier: supplierResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeUpdateSupplierUseCase();
        const result = await useCase.execute({
          id: request.params.id,
          ...request.body,
        });
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
