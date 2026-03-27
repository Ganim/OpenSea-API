import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { batchPredictResponseSchema } from '@/http/schemas/sales/predictions/prediction.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeBatchPredictUseCase } from '@/use-cases/sales/deal-predictions/factories/make-batch-predict-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function batchPredictController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/predictions/batch',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PREDICTIONS.ADMIN,
        resource: 'predictions',
      }),
    ],
    schema: {
      tags: ['Sales - Predictions'],
      summary: 'Run predictions for all open deals in batch',
      response: {
        200: batchPredictResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const useCase = makeBatchPredictUseCase();
      const result = await useCase.execute({ tenantId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.DEAL_PREDICTION_BATCH,
        entityId: tenantId,
        placeholders: {
          userName,
          processedCount: result.processedCount,
        },
      });

      return reply.status(200).send(result as any);
    },
  });
}
