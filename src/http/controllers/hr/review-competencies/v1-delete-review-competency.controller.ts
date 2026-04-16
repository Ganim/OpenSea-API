import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { reviewCompetencyItemParamsSchema } from '@/http/schemas/hr/reviews';
import { makeDeleteReviewCompetencyUseCase } from '@/use-cases/hr/review-competencies/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteReviewCompetencyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/performance-reviews/:reviewId/competencies/:competencyId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.REVIEWS.REMOVE,
        resource: 'performance-reviews',
      }),
    ],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'Delete review competency',
      description: 'Soft deletes a competency from a performance review',
      params: reviewCompetencyItemParamsSchema,
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { reviewId, competencyId } = request.params;

      try {
        const useCase = makeDeleteReviewCompetencyUseCase();
        await useCase.execute({
          tenantId,
          performanceReviewId: reviewId,
          competencyId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.REVIEW_COMPETENCY_DELETE,
          entityId: competencyId,
          placeholders: {
            userName: request.user.sub,
          },
        });

        return reply.status(204).send(null);
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
