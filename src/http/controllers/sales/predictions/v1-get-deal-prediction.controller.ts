import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { dealPredictionResponseSchema } from '@/http/schemas/sales/predictions/prediction.schema';
import { makeGetDealPredictionUseCase } from '@/use-cases/sales/deal-predictions/factories/make-get-deal-prediction-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getDealPredictionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/predictions/:dealId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PREDICTIONS.ACCESS,
        resource: 'predictions',
      }),
    ],
    schema: {
      tags: ['Sales - Predictions'],
      summary: 'Get the latest closure prediction for a deal',
      params: z.object({
        dealId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          prediction: dealPredictionResponseSchema.nullable(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { dealId } = request.params;

      const useCase = makeGetDealPredictionUseCase();
      const { prediction } = await useCase.execute({ tenantId, dealId });

      return reply.status(200).send({ prediction } as unknown);
    },
  });
}
