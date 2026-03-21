import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listCatalogsQuerySchema, catalogResponseSchema } from '@/http/schemas';
import { catalogToDTO } from '@/mappers/sales/catalog/catalog-to-dto';
import { makeListCatalogsUseCase } from '@/use-cases/sales/catalogs/factories/make-list-catalogs-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCatalogsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/catalogs',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CATALOGS.ACCESS,
        resource: 'catalogs',
      }),
    ],
    schema: {
      tags: ['Sales - Catalogs'],
      summary: 'List catalogs',
      querystring: listCatalogsQuerySchema,
      response: {
        200: z.object({
          data: z.array(catalogResponseSchema),
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
      const query = request.query;

      const useCase = makeListCatalogsUseCase();
      const { catalogs } = await useCase.execute({
        tenantId,
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.status,
        type: query.type,
        isPublic: query.isPublic,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return reply.status(200).send({
        data: catalogs.data.map((c) => catalogToDTO(c)),
        meta: {
          total: catalogs.total,
          page: catalogs.page,
          limit: catalogs.limit,
          pages: catalogs.totalPages,
        },
      });
    },
  });
}
