import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createReviewCompetencySchema,
  reviewCompetencyResponseSchema,
  reviewCompetencyRouteParamsSchema,
} from '@/http/schemas/hr/reviews';
import { reviewCompetencyToDTO } from '@/mappers/hr/review-competency';
import { makeCreateReviewCompetencyUseCase } from '@/use-cases/hr/review-competencies/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateReviewCompetencyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/performance-reviews/:reviewId/competencies',
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
      summary: 'Add competency to performance review',
      description:
        'Adds a competency to a performance review. Scores are typically null at creation time and filled in later by the employee or manager.',
      params: reviewCompetencyRouteParamsSchema,
      body: createReviewCompetencySchema,
      response: {
        201: z.object({ competency: reviewCompetencyResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { reviewId } = request.params;
      const body = request.body;

      try {
        const useCase = makeCreateReviewCompetencyUseCase();
        const { competency } = await useCase.execute({
          tenantId,
          performanceReviewId: reviewId,
          name: body.name,
          weight: body.weight,
          selfScore: body.selfScore,
          managerScore: body.managerScore,
          comments: body.comments,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.REVIEW_COMPETENCY_CREATE,
          entityId: competency.id.toString(),
          placeholders: {
            userName: request.user.sub,
            competencyName: competency.name,
          },
          newData: body as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ competency: reviewCompetencyToDTO(competency) });
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
