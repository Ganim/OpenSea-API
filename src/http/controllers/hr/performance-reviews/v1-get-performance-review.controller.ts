import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  performanceReviewWithAggregatesResponseSchema,
  reviewCompetencyResponseSchema,
} from '@/http/schemas/hr/reviews';
import { cuidSchema } from '@/http/schemas/common.schema';
import { performanceReviewToDTO } from '@/mappers/hr/performance-review';
import { reviewCompetencyToDTO } from '@/mappers/hr/review-competency';
import { makeGetPerformanceReviewUseCase } from '@/use-cases/hr/performance-reviews/factories/make-get-performance-review-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetPerformanceReviewController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/performance-reviews/:performanceReviewId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'Get performance review',
      description:
        'Gets a performance review by ID, including its competencies and weighted aggregated scores (selfScore and managerScore).',
      params: z.object({ performanceReviewId: cuidSchema }),
      response: {
        200: z.object({
          review: performanceReviewWithAggregatesResponseSchema,
          competencies: z.array(reviewCompetencyResponseSchema),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { performanceReviewId } = request.params;

      try {
        const useCase = makeGetPerformanceReviewUseCase();
        const {
          review,
          competencies,
          aggregatedSelfScore,
          aggregatedManagerScore,
        } = await useCase.execute({
          tenantId,
          performanceReviewId,
        });

        return reply.status(200).send({
          review: {
            ...performanceReviewToDTO(review),
            aggregatedSelfScore,
            aggregatedManagerScore,
          },
          competencies: competencies.map(reviewCompetencyToDTO),
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
