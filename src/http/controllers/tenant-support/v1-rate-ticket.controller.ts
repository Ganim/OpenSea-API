import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRateTicketUseCase } from '@/use-cases/admin/tenant-support/factories/make-rate-ticket-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function rateTicketController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/support/tickets/:id/rate',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Support'],
      summary: 'Rate a resolved support ticket',
      description:
        'Allows a tenant user to rate a resolved or closed ticket (1-5 stars). Requires tenant context.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
        }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { rating, comment } = request.body;
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const rateTicketUseCase = makeRateTicketUseCase();
        const { success } = await rateTicketUseCase.execute({
          ticketId: id,
          tenantId,
          userId,
          rating,
          comment,
        });

        return reply.status(200).send({ success });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
