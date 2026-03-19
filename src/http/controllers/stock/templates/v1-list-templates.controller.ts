import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema } from '@/http/schemas';
import { templateResponseSchema } from '@/http/schemas/stock/templates/template.schema';
import { makeListTemplatesUseCase } from '@/use-cases/stock/templates/factories/make-list-templates-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listTemplatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/templates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.TEMPLATES.LIST,
        resource: 'templates',
      }),
    ],
    schema: {
      tags: ['Stock - Templates'],
      summary: 'List all templates',
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
          templates: z.array(templateResponseSchema),
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

      const listTemplatesUseCase = makeListTemplatesUseCase();
      const { templates, meta } = await listTemplatesUseCase.execute({
        tenantId,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      return reply.status(200).send({ templates, meta });
    },
  });
}
