import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { supplierResponseSchema } from '@/http/schemas/stock/suppliers';
import { makeGetSupplierByIdUseCase } from '@/use-cases/stock/suppliers/factories/make-get-supplier-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getSupplierByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/suppliers/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.SUPPLIERS.ACCESS,
        resource: 'suppliers',
      }),
    ],
    schema: {
      tags: ['Stock - Suppliers'],
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
      const tenantId = request.user.tenantId!;

      const useCase = makeGetSupplierByIdUseCase();
      const result = await useCase.execute({
        tenantId,
        id: request.params.id,
      });
      return reply.status(200).send(result);
    },
  });
}
