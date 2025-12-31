import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { supplierResponseSchema } from '@/http/schemas/stock/suppliers';
import { makeListSuppliersUseCase } from '@/use-cases/stock/suppliers/factories/make-list-suppliers-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listSuppliersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/suppliers',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.SUPPLIERS.LIST,
        resource: 'suppliers',
      }),
    ],
    schema: {
      tags: ['Stock - Suppliers'],
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
