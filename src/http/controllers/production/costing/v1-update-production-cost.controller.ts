import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateProductionCostSchema,
  productionCostResponseSchema,
} from '@/http/schemas/production';
import { productionCostToDTO } from '@/mappers/production/production-cost-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateProductionCostUseCase } from '@/use-cases/production/production-costs/factories/make-update-production-cost-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateProductionCostController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/production/orders/:orderId/costs/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.COSTING.ADMIN,
        resource: 'production-costs',
      }),
    ],
    schema: {
      tags: ['Production - Costing'],
      summary: 'Update a production cost entry',
      params: z.object({
        orderId: z.string(),
        id: z.string(),
      }),
      body: updateProductionCostSchema,
      response: {
        200: z.object({
          cost: productionCostResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { orderId, id } = request.params;
      const { costType, description, plannedAmount, actualAmount } =
        request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateProductionCostUseCase = makeUpdateProductionCostUseCase();
      const { cost } = await updateProductionCostUseCase.execute({
        id,
        costType,
        description,
        plannedAmount,
        actualAmount,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.COST_UPDATE,
        entityId: id,
        placeholders: {
          userName,
          costType: cost.costType,
          orderId,
        },
        newData: { costType, description, plannedAmount, actualAmount },
      });

      return reply.status(200).send({ cost: productionCostToDTO(cost) });
    },
  });
}
