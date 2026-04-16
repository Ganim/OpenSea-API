import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listReviewCompetenciesResponseSchema,
  reviewCompetencyRouteParamsSchema,
} from '@/http/schemas/hr/reviews';
import { reviewCompetencyToDTO } from '@/mappers/hr/review-competency';
import { makeListReviewCompetenciesUseCase } from '@/use-cases/hr/review-competencies/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListReviewCompetenciesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/performance-reviews/:reviewId/competencies',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.REVIEWS.ACCESS,
        resource: 'performance-reviews',
      }),
    ],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'List review competencies',
      description: 'Lists all active competencies of a performance review',
      params: reviewCompetencyRouteParamsSchema,
      response: {
        200: listReviewCompetenciesResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { reviewId } = request.params;

      try {
        const useCase = makeListReviewCompetenciesUseCase();
        const { competencies } = await useCase.execute({
          tenantId,
          performanceReviewId: reviewId,
        });

        return reply.status(200).send({
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
