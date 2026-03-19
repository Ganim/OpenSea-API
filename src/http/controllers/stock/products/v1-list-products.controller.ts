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
        search: z.string().max(200).optional(),
        templateId: z.string().optional(),
        manufacturerId: z.string().optional(),
        categoryId: z.string().optional(),
        sortBy: z
          .enum(['name', 'createdAt', 'updatedAt'])
          .optional()
          .default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
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
      const {
        search,
        templateId,
        manufacturerId,
        categoryId,
        sortBy,
        sortOrder,
        page,
        limit,
      } = request.query;

      const templateIds = templateId?.split(',').filter(Boolean);
      const manufacturerIds = manufacturerId?.split(',').filter(Boolean);
      const categoryIds = categoryId?.split(',').filter(Boolean);

      const listProductsUseCase = makeListProductsUseCase();
      const { products, meta } = await listProductsUseCase.execute({
        tenantId,
        search,
        templateIds,
        manufacturerIds,
        categoryIds,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      return reply
        .status(200)
        .send({ products: products.map(productToDTO), meta });
    },
  });
}
