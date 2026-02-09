import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { productResponseSchema } from '@/http/schemas';
import { productToDTO } from '@/mappers/stock/product/product-to-dto';
import { makeListProductsUseCase } from '@/use-cases/stock/products/factories/make-list-products-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listProductsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/products',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.LIST,
        resource: 'products',
      }),
    ],
    schema: {
      tags: ['Stock - Products'],
      summary: 'List all products',
      querystring: z.object({
        manufacturerId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
      }),
      response: {
        200: z.object({
          products: z.array(productResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { manufacturerId, categoryId } = request.query as {
        manufacturerId?: string;
        categoryId?: string;
      };

      const listProductsUseCase = makeListProductsUseCase();
      const { products } = await listProductsUseCase.execute({
        tenantId,
        manufacturerId,
        categoryId,
      });

      return reply.status(200).send({ products: products.map(productToDTO) });
    },
  });
}
