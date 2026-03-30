import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listReviewCyclesQuerySchema,
  reviewCycleResponseSchema,
} from '@/http/schemas/hr/reviews';
import { reviewCycleToDTO } from '@/mappers/hr/review-cycle';
import { makeListReviewCyclesUseCase } from '@/use-cases/hr/review-cycles/factories/make-list-review-cycles-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListReviewCyclesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/review-cycles',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'List review cycles',
      description: 'Lists all review cycles with optional filters',
      querystring: listReviewCyclesQuerySchema,
      response: {
        200: z.object({
          reviewCycles: z.array(reviewCycleResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListReviewCyclesUseCase();
      const { reviewCycles, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        reviewCycles: reviewCycles.map(reviewCycleToDTO),
        total,
      });
    },
  });
}
