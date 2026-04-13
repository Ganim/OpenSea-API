import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createMaterialReturnSchema,
  materialReturnResponseSchema,
} from '@/http/schemas/production';
import { materialReturnToDTO } from '@/mappers/production/material-return-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateMaterialReturnUseCase } from '@/use-cases/production/material-returns/factories/make-create-material-return-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createMaterialReturnController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/material-returns',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.REGISTER,
        resource: 'material-returns',
      }),
    ],
    schema: {
      tags: ['Production - Materials'],
      summary: 'Create a material return',
      body: createMaterialReturnSchema,
      response: {
        201: z.object({
          materialReturn: materialReturnResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { productionOrderId, materialId, warehouseId, quantity, reason } =
        request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createMaterialReturnUseCase = makeCreateMaterialReturnUseCase();
      const { materialReturn } = await createMaterialReturnUseCase.execute({
        productionOrderId,
        materialId,
        warehouseId,
        quantity,
        reason,
        returnedById: userId,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.MATERIAL_RETURN,
        entityId: materialReturn.materialReturnId.toString(),
        placeholders: { userName, orderNumber: productionOrderId },
        newData: {
          productionOrderId,
          materialId,
          warehouseId,
          quantity,
          reason,
        },
      });

      return reply
        .status(201)
        .send({ materialReturn: materialReturnToDTO(materialReturn) });
    },
  });
}
