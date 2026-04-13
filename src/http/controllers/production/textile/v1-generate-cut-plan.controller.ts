import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  generateCutPlanSchema,
  cutPlanResponseSchema,
} from '@/http/schemas/production/textile.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGenerateCutPlanUseCase } from '@/use-cases/production/textile/factories/make-generate-cut-plan-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function generateCutPlanController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/orders/:orderId/cut-plan',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.ACCESS,
        resource: 'cut-plan',
      }),
    ],
    schema: {
      tags: ['Production - Textile'],
      summary: 'Generate a cut plan from a size-color matrix',
      params: z.object({
        orderId: z.string().min(1),
      }),
      body: generateCutPlanSchema,
      response: {
        200: z.object({
          cutPlan: cutPlanResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { orderId } = request.params;
      const {
        matrix,
        baseFabricConsumptionPerPiece,
        wastePercentage,
        spreadingTableWidthPieces,
        sizeConsumptionFactors,
      } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const useCase = makeGenerateCutPlanUseCase();
      const { cutPlan } = await useCase.execute({
        tenantId,
        productionOrderId: orderId,
        matrix,
        baseFabricConsumptionPerPiece,
        wastePercentage,
        spreadingTableWidthPieces,
        sizeConsumptionFactors,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.TEXTILE_CUT_PLAN_GENERATE,
        entityId: orderId,
        placeholders: {
          userName,
          orderNumber: cutPlan.orderNumber,
          totalPieces: String(cutPlan.totalPieces),
        },
        newData: {
          totalPieces: cutPlan.totalPieces,
          totalEstimatedFabricMeters: cutPlan.totalEstimatedFabricMeters,
          sizes: matrix.sizes,
          colors: matrix.colors,
        },
      });

      return reply.status(200).send({ cutPlan });
    },
  });
}
