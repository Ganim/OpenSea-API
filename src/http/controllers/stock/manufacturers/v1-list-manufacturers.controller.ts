import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema } from '@/http/schemas';
import { manufacturerResponseSchema } from '@/http/schemas/stock/manufacturers';
import { manufacturerToDTO } from '@/mappers/stock/manufacturer/manufacturer-to-dto';
import { makeListManufacturersUseCase } from '@/use-cases/stock/manufacturers/factories/make-list-manufacturers-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listManufacturersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/manufacturers',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.MANUFACTURERS.LIST,
        resource: 'manufacturers',
      }),
    ],
    schema: {
      tags: ['Stock - Manufacturers'],
      summary: 'List all manufacturers',
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
          manufacturers: z.array(manufacturerResponseSchema),
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

      const listManufacturersUseCase = makeListManufacturersUseCase();
      const { manufacturers, meta } = await listManufacturersUseCase.execute({
        tenantId,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      return reply
        .status(200)
        .send({ manufacturers: manufacturers.map(manufacturerToDTO), meta });
    },
  });
}
