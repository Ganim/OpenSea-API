import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteProductCareInstructionUseCase } from '@/use-cases/stock/product-care-instructions/factories/make-delete-product-care-instruction-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteProductCareInstructionController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/products/:productId/care-instructions/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.MODIFY,
        resource: 'product-care-instructions',
      }),
    ],
    schema: {
      tags: ['Stock - Product Care Instructions'],
      summary: 'Remove a care instruction from a product',
      params: z.object({
        productId: z.string().uuid(),
        id: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeDeleteProductCareInstructionUseCase();
      await useCase.execute({ id, tenantId });

      return reply.status(204).send(null);
    },
  });
}
