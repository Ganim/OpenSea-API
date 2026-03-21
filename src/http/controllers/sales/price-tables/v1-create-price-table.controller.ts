import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPriceTableSchema, priceTableResponseSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createPriceTableController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/price-tables',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRICE_TABLES.REGISTER,
        resource: 'price-tables',
      }),
    ],
    schema: {
      tags: ['Sales - Price Tables'],
      summary: 'Create a new price table',
      body: createPriceTableSchema,
      response: {
        201: z.object({
          priceTable: priceTableResponseSchema,
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const priceTable = await prisma.priceTable.create({
        data: {
          tenantId,
          name: body.name,
          description: body.description,
          type: body.type,
          currency: body.currency,
          priceIncludesTax: body.priceIncludesTax,
          isDefault: body.isDefault,
          priority: body.priority,
          isActive: body.isActive,
          validFrom: body.validFrom,
          validUntil: body.validUntil,
        },
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.PRICE_TABLE_CREATE,
        entityId: priceTable.id,
        placeholders: {
          userName: userId,
          tableName: priceTable.name,
        },
        newData: { name: body.name, type: body.type },
      });

      return reply.status(201).send({
        priceTable: {
          ...priceTable,
          description: priceTable.description ?? null,
          validFrom: priceTable.validFrom ?? null,
          validUntil: priceTable.validUntil ?? null,
          deletedAt: priceTable.deletedAt ?? null,
        },
      });
    },
  });
}
