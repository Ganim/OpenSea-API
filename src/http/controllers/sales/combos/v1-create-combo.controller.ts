import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { comboResponseSchema, createComboSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createComboController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/combos',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COMBOS.REGISTER,
        resource: 'combos',
      }),
    ],
    schema: {
      tags: ['Sales - Combos'],
      summary: 'Create a new combo',
      body: createComboSchema,
      response: {
        201: z.object({
          combo: comboResponseSchema,
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const combo = await prisma.combo.create({
        data: {
          tenantId,
          name: body.name,
          description: body.description,
          type: body.type,
          fixedPrice: body.fixedPrice,
          discountType: body.discountType,
          discountValue: body.discountValue,
          minItems: body.minItems,
          maxItems: body.maxItems,
          isActive: body.isActive,
          validFrom: body.validFrom,
          validUntil: body.validUntil,
          imageUrl: body.imageUrl,
          items: body.items
            ? {
                createMany: {
                  data: body.items.map((item) => ({
                    tenantId,
                    variantId: item.variantId,
                    categoryId: item.categoryId,
                    quantity: item.quantity,
                    isRequired: item.isRequired,
                    position: item.position,
                  })),
                },
              }
            : undefined,
        },
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.COMBO_CREATE,
        entityId: combo.id,
        placeholders: {
          userName: userId,
          comboName: combo.name,
        },
        newData: { name: body.name, type: body.type },
      });

      return reply.status(201).send({
        combo: {
          ...combo,
          fixedPrice: combo.fixedPrice ? Number(combo.fixedPrice) : null,
          discountValue: combo.discountValue ? Number(combo.discountValue) : null,
          description: combo.description ?? null,
          discountType: combo.discountType ?? null,
          minItems: combo.minItems ?? null,
          maxItems: combo.maxItems ?? null,
          validFrom: combo.validFrom ?? null,
          validUntil: combo.validUntil ?? null,
          imageUrl: combo.imageUrl ?? null,
          deletedAt: combo.deletedAt ?? null,
        },
      });
    },
  });
}
