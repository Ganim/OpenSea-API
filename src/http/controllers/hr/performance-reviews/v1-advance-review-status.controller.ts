import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  advanceReviewStatusSchema,
  performanceReviewResponseSchema,
} from '@/http/schemas/hr/reviews';
import { cuidSchema } from '@/http/schemas/common.schema';
import { performanceReviewToDTO } from '@/mappers/hr/performance-review';
import { makeAdvanceReviewStatusUseCase } from '@/use-cases/hr/performance-reviews/factories/make-advance-review-status-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AdvanceReviewStatusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/performance-reviews/:performanceReviewId/advance-status',
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
      summary: 'Advance review status',
      description:
        'Advances the performance review to the next stage (PENDING → SELF_ASSESSMENT → MANAGER_REVIEW → COMPLETED) without writing any score or comment fields. Body MUST be empty; any payload is rejected.',
      params: z.object({ performanceReviewId: cuidSchema }),
      body: advanceReviewStatusSchema,
      response: {
        200: z.object({ review: performanceReviewResponseSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const callerUserId = request.user.sub;
      const { performanceReviewId } = request.params;
      const hasReviewsAdmin =
        request.user.permissions?.includes(PermissionCodes.HR.REVIEWS.ADMIN) ??
        false;

      try {
        const useCase = makeAdvanceReviewStatusUseCase();
        const { review } = await useCase.execute({
          tenantId,
          performanceReviewId,
          callerUserId,
          bypassOwnership: hasReviewsAdmin,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PERFORMANCE_REVIEW_ADVANCE_STATUS,
          entityId: performanceReviewId,
          placeholders: {
            userName: request.user.sub,
            nextStatus: review.status,
          },
        });

        return reply
          .status(200)
          .send({ review: performanceReviewToDTO(review) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
