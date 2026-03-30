import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { performanceReviewResponseSchema } from '@/http/schemas/hr/reviews';
import { idSchema } from '@/http/schemas/common.schema';
import { performanceReviewToDTO } from '@/mappers/hr/performance-review';
import { makeAcknowledgeReviewUseCase } from '@/use-cases/hr/performance-reviews/factories/make-acknowledge-review-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AcknowledgeReviewController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/performance-reviews/:performanceReviewId/acknowledge',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'Acknowledge review',
      description: 'Employee acknowledges a completed performance review',
      params: z.object({ performanceReviewId: idSchema }),
      response: {
        200: z.object({ review: performanceReviewResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { performanceReviewId } = request.params;

      try {
        const useCase = makeAcknowledgeReviewUseCase();
        const { review } = await useCase.execute({
          tenantId,
          performanceReviewId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PERFORMANCE_REVIEW_ACKNOWLEDGE,
          entityId: performanceReviewId,
          placeholders: {
            userName: request.user.sub,
          },
        });

        return reply
          .status(200)
          .send({ review: performanceReviewToDTO(review) });
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
