import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listPriceTablesQuerySchema, priceTableResponseSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPriceTablesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/price-tables',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRICE_TABLES.ACCESS,
        resource: 'price-tables',
      }),
    ],
    schema: {
      tags: ['Sales - Price Tables'],
      summary: 'List all price tables',
      querystring: listPriceTablesQuerySchema,
      response: {
        200: z.object({
          priceTables: z.array(priceTableResponseSchema),
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
      const { page, limit, search, type, isActive, sortBy, sortOrder } = request.query;

      const where = {
        tenantId,
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      };

      const [priceTables, total] = await Promise.all([
        prisma.priceTable.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
        }),
        prisma.priceTable.count({ where }),
      ]);

      return reply.status(200).send({
        priceTables,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    },
  });
}
