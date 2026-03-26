import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { comboResponseSchema, updateComboSchema } from '@/http/schemas';
import { makeGetComboByIdUseCase } from '@/use-cases/sales/combos/factories/make-get-combo-by-id-use-case';
import { makeUpdateComboUseCase } from '@/use-cases/sales/combos/factories/make-update-combo-use-case';
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

      try {
        // Get existing for audit
        const getUseCase = makeGetComboByIdUseCase();
        const { combo: existingCombo } = await getUseCase.execute({
          id,
          tenantId,
        });

        const useCase = makeUpdateComboUseCase();
        const { combo } = await useCase.execute({
          id,
          tenantId,
          name: body.name,
          description: body.description ?? undefined,
          type: body.type,
          discountType:
            (body.discountType as 'PERCENTAGE' | undefined) ?? undefined,
          discountValue: body.discountValue ?? undefined,
          isActive: body.isActive,
          startDate: body.validFrom ?? undefined,
          endDate: body.validUntil ?? undefined,
          minItems: body.minItems ?? undefined,
          maxItems: body.maxItems ?? undefined,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.COMBO_UPDATE,
          entityId: combo.comboId.toString(),
          placeholders: {
            userName: userId,
            comboName: combo.name,
          },
          oldData: { name: existingCombo.name, type: existingCombo.type },
          newData: { name: combo.name, type: combo.type },
        });

        return reply.status(200).send({
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
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
