import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { reviewCycleResponseSchema } from '@/http/schemas/hr/reviews';
import { idSchema } from '@/http/schemas/common.schema';
import { reviewCycleToDTO } from '@/mappers/hr/review-cycle';
import { makeGetReviewCycleUseCase } from '@/use-cases/hr/review-cycles/factories/make-get-review-cycle-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetReviewCycleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/review-cycles/:reviewCycleId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'Get review cycle',
      description: 'Gets a review cycle by ID',
      params: z.object({ reviewCycleId: idSchema }),
      response: {
        200: z.object({ reviewCycle: reviewCycleResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { reviewCycleId } = request.params;

      try {
        const useCase = makeGetReviewCycleUseCase();
        const { reviewCycle } = await useCase.execute({
          tenantId,
          reviewCycleId,
        });

        return reply
          .status(200)
          .send({ reviewCycle: reviewCycleToDTO(reviewCycle) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
