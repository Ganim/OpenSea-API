import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createProductionCostSchema,
  productionCostResponseSchema,
} from '@/http/schemas/production';
import { productionCostToDTO } from '@/mappers/production/production-cost-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateProductionCostUseCase } from '@/use-cases/production/production-costs/factories/make-create-production-cost-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createProductionCostController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/orders/:orderId/costs',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.COSTING.ACCESS,
        resource: 'production-costs',
      }),
    ],
    schema: {
      tags: ['Production - Costing'],
      summary: 'Create a production cost entry for an order',
      params: z.object({
        orderId: z.string(),
      }),
      body: createProductionCostSchema,
      response: {
        201: z.object({
          cost: productionCostResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { orderId } = request.params;
      const { costType, description, plannedAmount, actualAmount } =
        request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createProductionCostUseCase = makeCreateProductionCostUseCase();
      const { cost } = await createProductionCostUseCase.execute({
        productionOrderId: orderId,
        costType,
        description,
        plannedAmount,
        actualAmount,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.COST_CREATE,
        entityId: cost.productionCostId.toString(),
        placeholders: { userName, costType, orderId },
        newData: { costType, description, plannedAmount, actualAmount },
      });

      return reply.status(201).send({ cost: productionCostToDTO(cost) });
    },
  });
}
