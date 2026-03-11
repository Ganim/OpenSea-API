import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema, productResponseSchema } from '@/http/schemas';
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
      querystring: paginationSchema.extend({
        templateId: z.string().uuid().optional(),
        manufacturerId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
      }),
      response: {
        200: z.object({
          products: z.array(productResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { templateId, manufacturerId, categoryId, page, limit } =
        request.query;

      const listProductsUseCase = makeListProductsUseCase();
      const { products, meta } = await listProductsUseCase.execute({
        tenantId,
        templateId,
        manufacturerId,
        categoryId,
        page,
        limit,
      });

      return reply
        .status(200)
        .send({ products: products.map(productToDTO), meta });
    },
  });
}
