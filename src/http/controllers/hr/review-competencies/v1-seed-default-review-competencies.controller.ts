import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  reviewCompetencyRouteParamsSchema,
  seedDefaultReviewCompetenciesResponseSchema,
} from '@/http/schemas/hr/reviews';
import { reviewCompetencyToDTO } from '@/mappers/hr/review-competency';
import { makeSeedDefaultReviewCompetenciesUseCase } from '@/use-cases/hr/review-competencies/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1SeedDefaultReviewCompetenciesController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/performance-reviews/:reviewId/competencies/seed-defaults',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.REVIEWS.MODIFY,
        resource: 'performance-reviews',
      }),
    ],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'Seed default competencies',
      description:
        'Idempotently creates the 5 standard competencies (Técnica, Comunicação, Liderança, Ownership, Entrega) for a performance review.',
      params: reviewCompetencyRouteParamsSchema,
      response: {
        200: seedDefaultReviewCompetenciesResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { reviewId } = request.params;

      try {
        const useCase = makeSeedDefaultReviewCompetenciesUseCase();
        const { competencies, createdCount, alreadyExistedCount } =
          await useCase.execute({
            tenantId,
            performanceReviewId: reviewId,
          });

        if (createdCount > 0) {
          await logAudit(request, {
            message: AUDIT_MESSAGES.HR.REVIEW_COMPETENCY_SEED_DEFAULTS,
            entityId: reviewId,
            placeholders: {
              userName: request.user.sub,
              createdCount: createdCount.toString(),
            },
          });
        }

        return reply.status(200).send({
          competencies: competencies.map(reviewCompetencyToDTO),
          createdCount,
          alreadyExistedCount,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
