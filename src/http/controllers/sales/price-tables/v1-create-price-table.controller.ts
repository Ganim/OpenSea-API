import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createPriceTableSchema,
  priceTableResponseSchema,
} from '@/http/schemas';
import { makeCreatePriceTableUseCase } from '@/use-cases/sales/price-tables/factories/make-create-price-table-use-case';
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

      try {
        const useCase = makeCreatePriceTableUseCase();
        const { priceTable } = await useCase.execute({
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
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PRICE_TABLE_CREATE,
          entityId: priceTable.id.toString(),
          placeholders: {
            userName: userId,
            tableName: priceTable.name,
          },
          newData: { name: body.name, type: body.type },
        });

        return reply.status(201).send({
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
        if (
          error instanceof BadRequestError ||
          error instanceof ConflictError
        ) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
