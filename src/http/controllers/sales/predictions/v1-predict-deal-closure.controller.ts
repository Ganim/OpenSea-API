import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { dealPredictionResponseSchema } from '@/http/schemas/sales/predictions/prediction.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makePredictDealClosureUseCase } from '@/use-cases/sales/deal-predictions/factories/make-predict-deal-closure-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function predictDealClosureController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/predictions/:dealId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PREDICTIONS.EXECUTE,
        resource: 'predictions',
      }),
    ],
    schema: {
      tags: ['Sales - Predictions'],
      summary: 'Generate AI-powered closure prediction for a deal',
      params: z.object({
        dealId: z.string().uuid(),
      }),
      response: {
        201: z.object({ prediction: dealPredictionResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { dealId } = request.params;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makePredictDealClosureUseCase();
        const { prediction } = await useCase.execute({ tenantId, dealId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.DEAL_PREDICTION_CREATE,
          entityId: prediction.id,
          placeholders: { userName, dealTitle: dealId },
          newData: {
            probability: prediction.probability,
            confidence: prediction.confidence,
          },
        });

        return reply.status(201).send({ prediction } as unknown);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
