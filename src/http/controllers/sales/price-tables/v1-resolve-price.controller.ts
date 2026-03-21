import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { resolvePriceResponseSchema, resolvePriceSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function resolvePriceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/price-resolver',
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
      summary: 'Resolve the best price for a variant',
      body: resolvePriceSchema,
      response: {
        200: z.object({
          result: resolvePriceResponseSchema,
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { variantId, customerId, quantity, priceTableId } = request.body;

      // 1. Check customer-specific price first (highest priority)
      if (customerId) {
        const customerPrice = await prisma.customerPrice.findFirst({
          where: {
            tenantId,
            customerId,
            variantId,
            OR: [
              { validFrom: null, validUntil: null },
              {
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
              },
              {
                validFrom: { lte: new Date() },
                validUntil: null,
              },
              {
                validFrom: null,
                validUntil: { gte: new Date() },
              },
            ],
          },
        });

        if (customerPrice) {
          return reply.status(200).send({
            result: {
              variantId,
              price: Number(customerPrice.price),
              source: 'customer_price',
              priceTableId: null,
              priceTableName: null,
              tiered: false,
            },
          });
        }
      }

      // 2. Check specific price table or find best match
      const now = new Date();
      const tableWhere = priceTableId
        ? { id: priceTableId, tenantId, deletedAt: null, isActive: true }
        : {
            tenantId,
            deletedAt: null,
            isActive: true,
            OR: [
              { validFrom: null, validUntil: null },
              { validFrom: { lte: now }, validUntil: { gte: now } },
              { validFrom: { lte: now }, validUntil: null },
              { validFrom: null, validUntil: { gte: now } },
            ],
          };

      const tables = await prisma.priceTable.findMany({
        where: tableWhere,
        orderBy: { priority: 'desc' },
      });

      for (const table of tables) {
        const item = await prisma.priceTableItem.findFirst({
          where: {
            priceTableId: table.id,
            variantId,
            minQuantity: { lte: quantity ?? 1 },
            OR: [
              { maxQuantity: null },
              { maxQuantity: { gte: quantity ?? 1 } },
            ],
          },
          orderBy: { minQuantity: 'desc' },
        });

        if (item) {
          return reply.status(200).send({
            result: {
              variantId,
              price: Number(item.price),
              source: 'price_table',
              priceTableId: table.id,
              priceTableName: table.name,
              tiered: item.minQuantity > 1,
            },
          });
        }
      }

      // 3. Fallback to variant default price
      const variant = await prisma.variant.findFirst({
        where: { id: variantId, tenantId },
        select: { id: true, price: true },
      });

      if (!variant) {
        return reply.status(404).send({ message: 'Variant not found' });
      }

      return reply.status(200).send({
        result: {
          variantId,
          price: Number(variant.price),
          source: 'default',
          priceTableId: null,
          priceTableName: null,
          tiered: false,
        },
      });
    },
  });
}
