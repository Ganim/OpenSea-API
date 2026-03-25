import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { comboResponseSchema, updateComboSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateComboController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/combos/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COMBOS.MODIFY,
        resource: 'combos',
      }),
    ],
    schema: {
      tags: ['Sales - Combos'],
      summary: 'Update a combo',
      params: z.object({
        id: z.string().uuid().describe('Combo UUID'),
      }),
      body: updateComboSchema,
      response: {
        200: z.object({
          combo: comboResponseSchema,
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

      const existingCombo = await prisma.combo.findFirst({
        where: { id, tenantId, deletedAt: null },
      });

      if (!existingCombo) {
        return reply.status(404).send({ message: 'Combo not found' });
      }

      const combo = await prisma.$transaction(async (tx) => {
        // If items are provided, replace all existing items
        if (body.items) {
          await tx.comboItem.deleteMany({ where: { comboId: id } });

          if (body.items.length > 0) {
            await tx.comboItem.createMany({
              data: body.items.map((item) => ({
                comboId: id,
                tenantId,
                variantId: item.variantId,
                categoryId: item.categoryId,
                quantity: item.quantity,
                isRequired: item.isRequired,
                position: item.position,
              })),
            });
          }
        }

        return tx.combo.update({
          where: { id },
          data: {
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
          },
        });
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.COMBO_UPDATE,
        entityId: combo.id,
        placeholders: {
          userName: userId,
          comboName: combo.name,
        },
        oldData: { name: existingCombo.name, type: existingCombo.type },
        newData: { name: combo.name, type: combo.type },
      });

      return reply.status(200).send({
        combo: {
          ...combo,
          fixedPrice: combo.fixedPrice ? Number(combo.fixedPrice) : null,
          discountValue: combo.discountValue
            ? Number(combo.discountValue)
            : null,
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
