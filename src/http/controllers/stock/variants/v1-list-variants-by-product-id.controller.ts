import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { variantWithAggregationsResponseSchema } from '@/http/schemas/stock.schema';
import { variantWithAggregationsToDTO } from '@/mappers/stock/variant/variant-to-dto';
import { makeListVariantsByProductIdUseCase } from '@/use-cases/stock/variants/factories/make-list-variants-by-product-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listVariantsByProductIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/products/:productId/variants',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VARIANTS.LIST,
        resource: 'variants',
      }),
    ],
    schema: {
      tags: ['Stock - Variants'],
      summary: 'List variants by product ID with aggregations',
      params: z.object({
        productId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          variants: z.array(variantWithAggregationsResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { productId } = request.params;
      const listVariantsByProductIdUseCase =
        makeListVariantsByProductIdUseCase();
      const { variants } = await listVariantsByProductIdUseCase.execute({
        tenantId,
        productId,
      });

      return reply
        .status(200)
        .send({ variants: variants.map(variantWithAggregationsToDTO) });
    },
  });
}
