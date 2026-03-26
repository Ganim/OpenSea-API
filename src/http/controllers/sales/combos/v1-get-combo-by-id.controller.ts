import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { comboResponseSchema } from '@/http/schemas';
import { makeGetComboByIdUseCase } from '@/use-cases/sales/combos/factories/make-get-combo-by-id-use-case';
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

      try {
        const useCase = makeGetComboByIdUseCase();
        const { combo } = await useCase.execute({ id, tenantId });

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
