import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeReviewEventUseCase } from '@/use-cases/esocial/events/factories/make-review-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { eventIdParamSchema } from './esocial-api-schemas';

const reviewEventBodySchema = z.object({
  notes: z.string().optional(),
});

export async function v1ReviewEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/esocial/events/:id/review',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Mark event as reviewed',
      description:
        'Transitions an event from DRAFT/VALIDATED to REVIEWED status',
      params: eventIdParamSchema,
      body: reviewEventBodySchema,
      response: {
        200: z.object({
          event: z.object({
            id: z.string(),
            status: z.string(),
            reviewedBy: z.string().optional(),
            reviewedAt: z.string().optional(),
          }),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;
      const { notes } = request.body;

      const useCase = makeReviewEventUseCase();
      const { event } = await useCase.execute({
        tenantId,
        eventId: id,
        reviewedBy: userId,
        notes,
      });

      return reply.status(200).send({
        event: {
          id: event.id.toString(),
          status: event.status,
          reviewedBy: event.reviewedBy,
          reviewedAt: event.reviewedAt?.toISOString(),
        },
      });
    },
  });
}
