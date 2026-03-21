import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { priceTableResponseSchema, updatePriceTableSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
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

      const existing = await prisma.priceTable.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!existing) {
        return reply.status(404).send({ message: 'Price table not found' });
      }

      const priceTable = await prisma.priceTable.update({
        where: { id },
        data: body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.PRICE_TABLE_UPDATE,
        entityId: priceTable.id,
        placeholders: {
          userName: userId,
          tableName: priceTable.name,
        },
        oldData: { name: existing.name, type: existing.type },
        newData: { name: body.name, type: body.type },
      });

      return reply.status(200).send({ priceTable });
    },
  });
}
