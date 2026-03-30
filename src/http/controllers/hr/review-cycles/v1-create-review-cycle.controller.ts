import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createReviewCycleSchema,
  reviewCycleResponseSchema,
} from '@/http/schemas/hr/reviews';
import { reviewCycleToDTO } from '@/mappers/hr/review-cycle';
import { makeCreateReviewCycleUseCase } from '@/use-cases/hr/review-cycles/factories/make-create-review-cycle-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateReviewCycleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/review-cycles',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.REVIEWS.REGISTER,
        resource: 'review-cycles',
      }),
    ],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'Create review cycle',
      description: 'Creates a new review cycle',
      body: createReviewCycleSchema,
      response: {
        201: z.object({ reviewCycle: reviewCycleResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreateReviewCycleUseCase();
        const { reviewCycle } = await useCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.REVIEW_CYCLE_CREATE,
          entityId: reviewCycle.id.toString(),
          placeholders: {
            userName: request.user.sub,
            cycleName: reviewCycle.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ reviewCycle: reviewCycleToDTO(reviewCycle) });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
