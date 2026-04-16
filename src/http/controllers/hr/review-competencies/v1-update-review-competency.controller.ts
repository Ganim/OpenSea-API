import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  reviewCompetencyItemParamsSchema,
  reviewCompetencyResponseSchema,
  updateReviewCompetencySchema,
} from '@/http/schemas/hr/reviews';
import { reviewCompetencyToDTO } from '@/mappers/hr/review-competency';
import { makeUpdateReviewCompetencyUseCase } from '@/use-cases/hr/review-competencies/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateReviewCompetencyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/performance-reviews/:reviewId/competencies/:competencyId',
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
      summary: 'Update review competency',
      description:
        'Updates scores, weight, name or comments of a competency. Pass null to selfScore/managerScore/comments to clear.',
      params: reviewCompetencyItemParamsSchema,
      body: updateReviewCompetencySchema,
      response: {
        200: z.object({ competency: reviewCompetencyResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { reviewId, competencyId } = request.params;
      const body = request.body;

      try {
        const useCase = makeUpdateReviewCompetencyUseCase();
        const { competency } = await useCase.execute({
          tenantId,
          performanceReviewId: reviewId,
          competencyId,
          name: body.name,
          weight: body.weight,
          selfScore: body.selfScore,
          managerScore: body.managerScore,
          comments: body.comments,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.REVIEW_COMPETENCY_UPDATE,
          entityId: competencyId,
          placeholders: {
            userName: request.user.sub,
            competencyName: competency.name,
          },
          newData: body as Record<string, unknown>,
        });

        return reply
          .status(200)
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
