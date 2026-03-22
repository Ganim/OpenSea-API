import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPriceTableItemsQuerySchema,
  priceTableItemResponseSchema,
} from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPriceTableItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/price-tables/:id/items',
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
      summary: 'List items of a price table',
      params: z.object({
        id: z.string().uuid().describe('Price table UUID'),
      }),
      querystring: listPriceTableItemsQuerySchema,
      response: {
        200: z.object({
          items: z.array(priceTableItemResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: priceTableId } = request.params;
      const { page, limit, variantId, sortBy, sortOrder } = request.query;

      const priceTable = await prisma.priceTable.findFirst({
        where: { id: priceTableId, tenantId, deletedAt: null },
      });

      if (!priceTable) {
        return reply.status(404).send({ message: 'Price table not found' });
      }

      const where = {
        priceTableId,
        tenantId,
        ...(variantId && { variantId }),
      };

      const [items, total] = await Promise.all([
        prisma.priceTableItem.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
        }),
        prisma.priceTableItem.count({ where }),
      ]);

      return reply.status(200).send({
        items: items.map((item) => ({
          ...item,
          price: Number(item.price),
          costPrice: item.costPrice ? Number(item.costPrice) : null,
          marginPercent: item.marginPercent ? Number(item.marginPercent) : null,
        })),
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
