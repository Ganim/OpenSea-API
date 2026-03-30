import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  reviewCycleResponseSchema,
  updateReviewCycleSchema,
} from '@/http/schemas/hr/reviews';
import { idSchema } from '@/http/schemas/common.schema';
import { reviewCycleToDTO } from '@/mappers/hr/review-cycle';
import { makeUpdateReviewCycleUseCase } from '@/use-cases/hr/review-cycles/factories/make-update-review-cycle-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateReviewCycleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/review-cycles/:reviewCycleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.REVIEWS.MODIFY,
        resource: 'review-cycles',
      }),
    ],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'Update review cycle',
      description: 'Updates an existing review cycle',
      params: z.object({ reviewCycleId: idSchema }),
      body: updateReviewCycleSchema,
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
      const data = request.body;

      try {
        const useCase = makeUpdateReviewCycleUseCase();
        const { reviewCycle } = await useCase.execute({
          tenantId,
          reviewCycleId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.REVIEW_CYCLE_UPDATE,
          entityId: reviewCycle.id.toString(),
          placeholders: {
            userName: request.user.sub,
            cycleName: reviewCycle.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(200)
          .send({ reviewCycle: reviewCycleToDTO(reviewCycle) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
