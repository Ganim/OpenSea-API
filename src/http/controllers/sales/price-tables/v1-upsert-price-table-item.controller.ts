import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  priceTableItemResponseSchema,
  upsertPriceTableItemSchema,
} from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function upsertPriceTableItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/price-tables/:id/items',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRICE_TABLES.MODIFY,
        resource: 'price-tables',
      }),
    ],
    schema: {
      tags: ['Sales - Price Tables'],
      summary: 'Upsert price table items',
      params: z.object({
        id: z.string().uuid().describe('Price table UUID'),
      }),
      body: upsertPriceTableItemSchema,
      response: {
        200: z.object({
          items: z.array(priceTableItemResponseSchema),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: priceTableId } = request.params;
      const { items } = request.body;

      const priceTable = await prisma.priceTable.findFirst({
        where: { id: priceTableId, tenantId, deletedAt: null },
      });

      if (!priceTable) {
        return reply.status(404).send({ message: 'Price table not found' });
      }

      const upsertedItems = await prisma.$transaction(
        items.map((item) =>
          prisma.priceTableItem.upsert({
            where: {
              priceTableId_variantId_minQuantity: {
                priceTableId,
                variantId: item.variantId,
                minQuantity: item.minQuantity ?? 1,
              },
            },
            create: {
              priceTableId,
              tenantId,
              variantId: item.variantId,
              price: item.price,
              minQuantity: item.minQuantity ?? 1,
              maxQuantity: item.maxQuantity,
              costPrice: item.costPrice,
              marginPercent: item.marginPercent,
            },
            update: {
              price: item.price,
              maxQuantity: item.maxQuantity,
              costPrice: item.costPrice,
              marginPercent: item.marginPercent,
            },
          }),
        ),
      );

      return reply.status(200).send({
        items: upsertedItems.map((item) => ({
          ...item,
          price: Number(item.price),
          costPrice: item.costPrice ? Number(item.costPrice) : null,
          marginPercent: item.marginPercent ? Number(item.marginPercent) : null,
        })),
      });
    },
  });
}
