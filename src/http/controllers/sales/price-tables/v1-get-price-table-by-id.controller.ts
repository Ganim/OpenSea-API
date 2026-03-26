import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { priceTableResponseSchema } from '@/http/schemas';
import { makeGetPriceTableByIdUseCase } from '@/use-cases/sales/price-tables/factories/make-get-price-table-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getPriceTableByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/price-tables/:id',
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
      summary: 'Get a price table by ID',
      params: z.object({
        id: z.string().uuid().describe('Price table UUID'),
      }),
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
      const { id } = request.params;

      try {
        const useCase = makeGetPriceTableByIdUseCase();
        const { priceTable } = await useCase.execute({ id, tenantId });

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
