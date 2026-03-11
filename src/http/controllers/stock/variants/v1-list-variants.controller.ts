import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema, variantResponseSchema } from '@/http/schemas';
import { variantToDTO } from '@/mappers/stock/variant/variant-to-dto';
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
        permissionCode: PermissionCodes.STOCK.VARIANTS.LIST,
        resource: 'variants',
      }),
    ],
    schema: {
      tags: ['Stock - Variants'],
      summary: 'List all variants',
      querystring: paginationSchema,
      response: {
        200: z.object({
          variants: z.array(variantResponseSchema),
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
      const { page, limit } = request.query;

      const listVariantsUseCase = makeListVariantsUseCase();
      const { variants, meta } = await listVariantsUseCase.execute({
        tenantId,
        page,
        limit,
      });

      return reply
        .status(200)
        .send({ variants: variants.map(variantToDTO), meta });
    },
  });
}
