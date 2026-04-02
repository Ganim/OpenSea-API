import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { reviewCycleResponseSchema } from '@/http/schemas/hr/reviews';
import { cuidSchema } from '@/http/schemas/common.schema';
import { reviewCycleToDTO } from '@/mappers/hr/review-cycle';
import { makeCloseReviewCycleUseCase } from '@/use-cases/hr/review-cycles/factories/make-close-review-cycle-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CloseReviewCycleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/review-cycles/:reviewCycleId/close',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.REVIEWS.ADMIN,
        resource: 'review-cycles',
      }),
    ],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'Close review cycle',
      description: 'Closes a review cycle',
      params: z.object({ reviewCycleId: cuidSchema }),
      response: {
        200: z.object({ reviewCycle: reviewCycleResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { reviewCycleId } = request.params;

      try {
        const useCase = makeCloseReviewCycleUseCase();
        const { reviewCycle } = await useCase.execute({
          tenantId,
          reviewCycleId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.REVIEW_CYCLE_CLOSE,
          entityId: reviewCycleId,
          placeholders: {
            userName: request.user.sub,
            cycleName: reviewCycle.name,
          },
        });

        return reply
          .status(200)
          .send({ reviewCycle: reviewCycleToDTO(reviewCycle) });
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
