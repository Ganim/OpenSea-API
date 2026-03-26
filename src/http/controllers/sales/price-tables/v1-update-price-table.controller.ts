import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  priceTableResponseSchema,
  updatePriceTableSchema,
} from '@/http/schemas';
import { makeGetPriceTableByIdUseCase } from '@/use-cases/sales/price-tables/factories/make-get-price-table-by-id-use-case';
import { makeUpdatePriceTableUseCase } from '@/use-cases/sales/price-tables/factories/make-update-price-table-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updatePriceTableController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/price-tables/:id',
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
      summary: 'Update a price table',
      params: z.object({
        id: z.string().uuid().describe('Price table UUID'),
      }),
      body: updatePriceTableSchema,
      response: {
        200: z.object({
          priceTable: priceTableResponseSchema,
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;
      const body = request.body;

      try {
        // Get existing for audit
        const getUseCase = makeGetPriceTableByIdUseCase();
        const { priceTable: existing } = await getUseCase.execute({
          id,
          tenantId,
        });

        const useCase = makeUpdatePriceTableUseCase();
        const { priceTable } = await useCase.execute({
          id,
          tenantId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PRICE_TABLE_UPDATE,
          entityId: priceTable.id.toString(),
          placeholders: {
            userName: userId,
            tableName: priceTable.name,
          },
          oldData: { name: existing.name, type: existing.type },
          newData: { name: body.name, type: body.type },
        });

        return reply.status(200).send({
          priceTable: {
            id: priceTable.id.toString(),
            tenantId: priceTable.tenantId.toString(),
            name: priceTable.name,
            description: priceTable.description ?? null,
            type: priceTable.type,
            currency: priceTable.currency,
            priceIncludesTax: priceTable.priceIncludesTax,
            isDefault: priceTable.isDefault,
            priority: priceTable.priority,
            isActive: priceTable.isActive,
            validFrom: priceTable.validFrom ?? null,
            validUntil: priceTable.validUntil ?? null,
            deletedAt: priceTable.deletedAt ?? null,
            createdAt: priceTable.createdAt,
            updatedAt: priceTable.updatedAt ?? null,
          },
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
