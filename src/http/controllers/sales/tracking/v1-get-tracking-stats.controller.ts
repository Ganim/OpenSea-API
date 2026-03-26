import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetTrackingStatsUseCase } from '@/use-cases/sales/tracking/factories/make-get-tracking-stats-use-case';
import type { TrackableEntityType } from '@/use-cases/sales/tracking/record-view';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getTrackingStatsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/tracking/:type/:id/stats',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Tracking'],
      summary: 'Get view tracking stats for a quote or proposal',
      params: z.object({
        type: z.enum(['quote', 'proposal']),
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          viewCount: z.number(),
          viewedAt: z.coerce.date().nullable(),
          lastViewedAt: z.coerce.date().nullable(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { type, id } = request.params as {
        type: TrackableEntityType;
        id: string;
      };
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetTrackingStatsUseCase();
        const { trackingStats } = await useCase.execute({
          tenantId,
          entityType: type,
          entityId: id,
        });

        return reply.status(200).send({
          viewCount: trackingStats.viewCount,
          viewedAt: trackingStats.viewedAt ?? null,
          lastViewedAt: trackingStats.lastViewedAt ?? null,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
