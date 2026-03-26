import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { comboResponseSchema, createComboSchema } from '@/http/schemas';
import { makeCreateComboUseCase } from '@/use-cases/sales/combos/factories/make-create-combo-use-case';
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

      try {
        const useCase = makeCreateComboUseCase();
        const { combo } = await useCase.execute({
          tenantId,
          name: body.name,
          description: body.description,
          type: body.type,
          discountType: (body.discountType ?? 'PERCENTAGE') as 'PERCENTAGE',
          discountValue: body.discountValue ?? 0,
          isActive: body.isActive,
          startDate: body.validFrom,
          endDate: body.validUntil,
          minItems: body.minItems,
          maxItems: body.maxItems,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.COMBO_CREATE,
          entityId: combo.comboId.toString(),
          placeholders: {
            userName: userId,
            comboName: combo.name,
          },
          newData: { name: body.name, type: body.type },
        });

        return reply.status(201).send({
          combo: {
            id: combo.comboId.toString(),
            tenantId: combo.tenantId.toString(),
            name: combo.name,
            description: combo.description ?? null,
            type: combo.type,
            discountType: combo.discountType ?? null,
            discountValue: combo.discountValue
              ? Number(combo.discountValue)
              : null,
            fixedPrice: null,
            isActive: combo.isActive,
            minItems: combo.minItems ?? null,
            maxItems: combo.maxItems ?? null,
            validFrom: combo.startDate ?? null,
            validUntil: combo.endDate ?? null,
            imageUrl: null,
            deletedAt: combo.deletedAt ?? null,
            createdAt: combo.createdAt,
            updatedAt: combo.updatedAt,
          },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
