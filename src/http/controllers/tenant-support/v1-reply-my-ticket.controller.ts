import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeReplyMyTicketUseCase } from '@/use-cases/admin/tenant-support/factories/make-reply-my-ticket-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function replyMyTicketController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/support/tickets/:id/reply',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Support'],
      summary: 'Reply to my support ticket',
      description:
        'Adds a reply to own support ticket. Reopens ticket if it was waiting for client response. Requires tenant context.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        body: z.string().min(1).max(10000),
      }),
      response: {
        201: z.object({
          message: z.object({
            id: z.string(),
            ticketId: z.string(),
            authorId: z.string().nullable(),
            authorType: z.string(),
            body: z.string(),
            isInternal: z.boolean(),
            createdAt: z.coerce.date(),
          }),
        }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { body } = request.body;
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const replyMyTicketUseCase = makeReplyMyTicketUseCase();
        const { message } = await replyMyTicketUseCase.execute({
          ticketId: id,
          tenantId,
          userId,
          body,
        });

        return reply.status(201).send({ message });
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
