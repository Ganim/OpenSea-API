import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPerformanceReviewsQuerySchema,
  performanceReviewResponseSchema,
} from '@/http/schemas/hr/reviews';
import { performanceReviewToDTO } from '@/mappers/hr/performance-review';
import { makeListPerformanceReviewsUseCase } from '@/use-cases/hr/performance-reviews/factories/make-list-performance-reviews-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListPerformanceReviewsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/performance-reviews',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'List performance reviews',
      description: 'Lists all performance reviews with optional filters',
      querystring: listPerformanceReviewsQuerySchema,
      response: {
        200: z.object({
          reviews: z.array(performanceReviewResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListPerformanceReviewsUseCase();
      const { reviews, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        reviews: reviews.map(performanceReviewToDTO),
        total,
      });
    },
  });
}
