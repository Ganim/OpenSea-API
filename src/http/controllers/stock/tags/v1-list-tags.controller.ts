import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema } from '@/http/schemas';
import { tagResponseSchema } from '@/http/schemas/stock.schema';
import { makeListTagsUseCase } from '@/use-cases/stock/tags/factories/make-list-tags-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listTagsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tags',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.ADMIN,
        resource: 'tags',
      }),
    ],
    schema: {
      tags: ['Stock - Tags'],
      summary: 'List all tags',
      querystring: paginationSchema.extend({
        search: z.string().max(200).optional(),
        sortBy: z
          .enum(['name', 'createdAt', 'updatedAt'])
          .optional()
          .default('name'),
        sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
      }),
      response: {
        200: z.object({
          tags: z.array(tagResponseSchema),
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
      const { search, sortBy, sortOrder, page, limit } = request.query;

      const listTagsUseCase = makeListTagsUseCase();
      const { tags, meta } = await listTagsUseCase.execute({
        tenantId,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      return reply.status(200).send({ tags, meta });
    },
  });
}
