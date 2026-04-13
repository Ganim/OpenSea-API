import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema } from '@/http/schemas';
import { templateResponseSchema } from '@/http/schemas/stock/templates/template.schema';
import { prisma } from '@/lib/prisma';
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
        permissionCode: PermissionCodes.STOCK.TEMPLATES.ACCESS,
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

      // Efficient single query to get product counts for all returned templates
      const templateIds = templates.map((t) => t.id);
      const productCounts =
        templateIds.length > 0
          ? await prisma.product.groupBy({
              by: ['templateId'],
              where: {
                tenantId,
                templateId: { in: templateIds },
                deletedAt: null,
              },
              _count: { id: true },
            })
          : [];

      const countMap = new Map(
        productCounts.map((pc) => [pc.templateId, pc._count.id]),
      );

      const templatesWithCount = templates.map((t) => ({
        ...t,
        productCount: countMap.get(t.id) ?? 0,
      }));

      return reply.status(200).send({ templates: templatesWithCount, meta });
    },
  });
}
