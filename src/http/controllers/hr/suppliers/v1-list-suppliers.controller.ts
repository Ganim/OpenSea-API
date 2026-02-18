import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listSuppliersQuerySchema,
  supplierResponseSchema,
} from '@/http/schemas/hr.schema';
import { supplierToDTO } from '@/mappers/hr/organization/supplier-to-dto';
import { makeListSuppliersUseCase } from '@/use-cases/hr/suppliers/factories/make-suppliers';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListSuppliersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/suppliers',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Suppliers'],
      summary: 'List suppliers',
      description:
        'Lists suppliers with filtering, pagination and search capabilities',
      querystring: listSuppliersQuerySchema,
      response: {
        200: z.array(supplierResponseSchema),
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
      const tenantId = request.user.tenantId!;
      const query = request.query;

      try {
        const listSuppliersUseCase = makeListSuppliersUseCase();
        const { suppliers } = await listSuppliersUseCase.execute({
          tenantId,
          ...query,
        });

        return reply.status(200).send(suppliers.map(supplierToDTO));
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
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
