import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
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
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.LIST,
        resource: 'products',
      }),
    ],
    schema: {
      tags: ['Stock - Products'],
      summary: 'List all products',
      response: {
        200: z.object({
          products: z.array(productResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (_, reply) => {
      const listProductsUseCase = makeListProductsUseCase();
      const { products } = await listProductsUseCase.execute();

      return reply.status(200).send({ products: products.map(productToDTO) });
    },
  });
}
