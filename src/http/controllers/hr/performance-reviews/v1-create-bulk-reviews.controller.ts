import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createBulkReviewsSchema,
  performanceReviewResponseSchema,
} from '@/http/schemas/hr/reviews';
import { performanceReviewToDTO } from '@/mappers/hr/performance-review';
import { makeCreateBulkReviewsUseCase } from '@/use-cases/hr/performance-reviews/factories/make-create-bulk-reviews-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateBulkReviewsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/performance-reviews/bulk',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.REVIEWS.REGISTER,
        resource: 'performance-reviews',
      }),
    ],
    schema: {
      tags: ['HR - Reviews'],
      summary: 'Create bulk performance reviews',
      description: 'Creates multiple performance reviews for a cycle',
      body: createBulkReviewsSchema,
      response: {
        201: z.object({
          reviews: z.array(performanceReviewResponseSchema),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreateBulkReviewsUseCase();
        const { reviews } = await useCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PERFORMANCE_REVIEW_BULK_CREATE,
          entityId: data.reviewCycleId,
          placeholders: {
            userName: request.user.sub,
            count: reviews.length.toString(),
            cycleName: data.reviewCycleId,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ reviews: reviews.map(performanceReviewToDTO) });
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
