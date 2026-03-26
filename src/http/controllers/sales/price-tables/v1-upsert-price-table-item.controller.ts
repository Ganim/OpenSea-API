import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  priceTableItemResponseSchema,
  upsertPriceTableItemSchema,
} from '@/http/schemas';
import { makeUpsertPriceTableItemUseCase } from '@/use-cases/sales/price-tables/factories/make-upsert-price-table-item-use-case';
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

      try {
        const useCase = makeUpsertPriceTableItemUseCase();

        const upsertedItems = [];
        for (const itemData of items) {
          const { priceTableItem } = await useCase.execute({
            tenantId,
            priceTableId,
            variantId: itemData.variantId,
            price: itemData.price,
            minQuantity: itemData.minQuantity,
            maxQuantity: itemData.maxQuantity,
            costPrice: itemData.costPrice,
            marginPercent: itemData.marginPercent,
          });
          upsertedItems.push({
            id: priceTableItem.id.toString(),
            priceTableId: priceTableItem.priceTableId.toString(),
            tenantId: priceTableItem.tenantId.toString(),
            variantId: priceTableItem.variantId.toString(),
            price: priceTableItem.price,
            minQuantity: priceTableItem.minQuantity,
            maxQuantity: priceTableItem.maxQuantity ?? null,
            costPrice: priceTableItem.costPrice ?? null,
            marginPercent: priceTableItem.marginPercent ?? null,
            createdAt: priceTableItem.createdAt,
            updatedAt: priceTableItem.updatedAt ?? null,
          });
        }

        return reply.status(200).send({ items: upsertedItems });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
