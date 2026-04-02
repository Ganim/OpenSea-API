import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cuidSchema } from '@/http/schemas/common.schema';
import { makeDeleteReviewCycleUseCase } from '@/use-cases/hr/review-cycles/factories/make-delete-review-cycle-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteReviewCycleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/review-cycles/:reviewCycleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.REVIEWS.REMOVE,
        resource: 'review-cycles',
      }),
    ],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'Delete review cycle',
      description: 'Deactivates a review cycle (soft delete)',
      params: z.object({ reviewCycleId: cuidSchema }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { reviewCycleId } = request.params;

      try {
        const useCase = makeDeleteReviewCycleUseCase();
        const { reviewCycle } = await useCase.execute({
          tenantId,
          reviewCycleId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.REVIEW_CYCLE_DELETE,
          entityId: reviewCycleId,
          placeholders: {
            userName: request.user.sub,
            cycleName: reviewCycle.name,
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
