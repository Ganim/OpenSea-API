import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema, supplierResponseSchema } from '@/http/schemas/hr.schema';
import { supplierToDTO } from '@/mappers/hr/organization/supplier-to-dto';
import { makeGetSupplierByIdUseCase } from '@/use-cases/hr/suppliers/factories/make-suppliers';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetSupplierByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/suppliers/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Suppliers'],
      summary: 'Get supplier by ID',
      description: 'Retrieves a supplier by its ID',
      params: z.object({
        id: idSchema,
      }),
      response: {
        200: supplierResponseSchema,
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getSupplierByIdUseCase = makeGetSupplierByIdUseCase();
        const { supplier } = await getSupplierByIdUseCase.execute({ id });

        return reply.status(200).send(supplierToDTO(supplier));
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
