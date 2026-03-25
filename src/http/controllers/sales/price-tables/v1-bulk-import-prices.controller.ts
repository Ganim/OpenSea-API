import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { priceTableItemResponseSchema } from '@/http/schemas';
import { makeBulkImportPricesUseCase } from '@/use-cases/sales/price-tables/factories/make-bulk-import-prices-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const bulkImportPricesBodySchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid().describe('Variant ID'),
        price: z.number().positive().describe('Unit price'),
        minQuantity: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe('Minimum quantity for this price tier'),
        maxQuantity: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe('Maximum quantity for this price tier'),
        costPrice: z.number().positive().optional().describe('Cost price'),
        marginPercent: z
          .number()
          .min(0)
          .max(100)
          .optional()
          .describe('Margin percentage'),
      }),
    )
    .min(1)
    .max(500)
    .describe('Price items to import (max 500 per request)'),
});

export async function bulkImportPricesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/price-tables/:priceTableId/bulk-import',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRICE_TABLES.ADMIN,
        resource: 'price-tables',
      }),
    ],
    schema: {
      tags: ['Sales - Price Tables'],
      summary: 'Bulk import prices into a price table',
      params: z.object({
        priceTableId: z.string().uuid().describe('Price table UUID'),
      }),
      body: bulkImportPricesBodySchema,
      response: {
        201: z.object({
          imported: z.array(priceTableItemResponseSchema),
          count: z.number(),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { priceTableId } = request.params;
      const { items } = request.body;

      try {
        const useCase = makeBulkImportPricesUseCase();
        const { imported, count } = await useCase.execute({
          tenantId,
          priceTableId,
          items,
        });

        const importedDTO = imported.map((priceTableItem) => ({
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
          updatedAt: priceTableItem.updatedAt,
        }));

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PRICE_TABLE_BULK_IMPORT,
          entityId: priceTableId,
          placeholders: {
            userName: userId,
            tableName: priceTableId,
            count: String(count),
          },
          newData: { priceTableId, itemCount: count },
        });

        return reply.status(201).send({
          imported: importedDTO,
          count,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
