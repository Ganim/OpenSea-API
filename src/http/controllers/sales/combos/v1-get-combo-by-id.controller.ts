import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { comboResponseSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getComboByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/combos/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COMBOS.ACCESS,
        resource: 'combos',
      }),
    ],
    schema: {
      tags: ['Sales - Combos'],
      summary: 'Get a combo by ID',
      params: z.object({
        id: z.string().uuid().describe('Combo UUID'),
      }),
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
      const { id } = request.params;

      const combo = await prisma.combo.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: {
          comboItems: {
            orderBy: { position: 'asc' },
            include: {
              variant: {
                select: { id: true, name: true, sku: true, price: true },
              },
            },
          },
        },
      });

      if (!combo) {
        return reply.status(404).send({ message: 'Combo not found' });
      }

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
          items: combo.comboItems.map((item) => ({
            id: item.id,
            variantId: item.variantId,
            quantity: item.quantity,
            isRequired: item.isRequired,
            position: item.position,
            variant: item.variant
              ? {
                  id: item.variant.id,
                  name: item.variant.name,
                  sku: item.variant.sku,
                  price: item.variant.price ? Number(item.variant.price) : null,
                }
              : null,
          })),
        },
      });
    },
  });
}
