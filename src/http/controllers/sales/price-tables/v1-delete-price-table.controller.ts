import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetPriceTableByIdUseCase } from '@/use-cases/sales/price-tables/factories/make-get-price-table-by-id-use-case';
import { makeDeletePriceTableUseCase } from '@/use-cases/sales/price-tables/factories/make-delete-price-table-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deletePriceTableController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/price-tables/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRICE_TABLES.REMOVE,
        resource: 'price-tables',
      }),
    ],
    schema: {
      tags: ['Sales - Price Tables'],
      summary: 'Delete a price table (soft delete)',
      params: z.object({
        id: z.string().uuid().describe('Price table UUID'),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;

      try {
        // Get existing for audit
        const getUseCase = makeGetPriceTableByIdUseCase();
        const { priceTable: existing } = await getUseCase.execute({
          id,
          tenantId,
        });

        const useCase = makeDeletePriceTableUseCase();
        await useCase.execute({ id, tenantId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PRICE_TABLE_DELETE,
          entityId: id,
          placeholders: {
            userName: userId,
            tableName: existing.name,
          },
          oldData: { name: existing.name, type: existing.type },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
