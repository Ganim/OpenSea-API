import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeApproveEventUseCase } from '@/use-cases/esocial/events/factories/make-approve-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { eventIdParamSchema } from './esocial-api-schemas';

export async function v1ApproveEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/esocial/events/:id/approve',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Approve event for transmission',
      description: 'Transitions an event from REVIEWED to APPROVED status',
      params: eventIdParamSchema,
      response: {
        200: z.object({
          event: z.object({
            id: z.string(),
            status: z.string(),
            approvedBy: z.string().optional(),
            approvedAt: z.string().optional(),
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

      const useCase = makeApproveEventUseCase();
      const { event } = await useCase.execute({
        tenantId,
        eventId: id,
        approvedBy: userId,
      });

      return reply.status(200).send({
        event: {
          id: event.id.toString(),
          status: event.status,
          approvedBy: event.approvedBy,
          approvedAt: event.approvedAt?.toISOString(),
        },
      });
    },
  });
}
