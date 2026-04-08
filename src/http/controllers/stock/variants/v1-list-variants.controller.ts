import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  paginationSchema,
  queryBooleanSchema,
  variantWithProductResponseSchema,
} from '@/http/schemas';
import {
  variantToDTO,
  variantWithProductToDTO,
} from '@/mappers/stock/variant/variant-to-dto';
import { makeListVariantsUseCase } from '@/use-cases/stock/variants/factories/make-list-variants-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listVariantsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/variants',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VARIANTS.ACCESS,
        resource: 'variants',
      }),
    ],
    schema: {
      tags: ['Stock - Variants'],
      summary: 'List all variants',
      querystring: paginationSchema.extend({
        search: z.string().optional(),
        categoryId: z.string().optional(),
        barcode: z.string().optional(),
        hasStock: queryBooleanSchema.optional(),
        onlyActive: queryBooleanSchema.optional(),
        includeProduct: queryBooleanSchema.optional(),
      }),
      response: {
        200: z.object({
          variants: z.array(variantWithProductResponseSchema),
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
        page,
        limit,
        search,
        categoryId,
        barcode,
        onlyActive,
        includeProduct,
      } = request.query;

      const listVariantsUseCase = makeListVariantsUseCase();
      const { variants, productInfoById, meta } =
        await listVariantsUseCase.execute({
          tenantId,
          page,
          limit,
          search,
          categoryId,
          barcode,
          onlyActive,
          includeProduct,
        });

      const variantsPayload = includeProduct
        ? variants.map((v) =>
            variantWithProductToDTO(v, productInfoById?.[v.id.toString()]),
          )
        : variants.map(variantToDTO);

      return reply.status(200).send({ variants: variantsPayload, meta });
    },
  });
}
