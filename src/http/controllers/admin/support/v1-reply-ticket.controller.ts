import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeReplyTicketUseCase } from '@/use-cases/admin/support/factories/make-reply-ticket-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function replyTicketAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/support/tickets/:id/reply',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Support'],
      summary: 'Reply to a support ticket (super admin)',
      description:
        'Adds a reply message to a support ticket. Can be external or internal note. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        body: z.string().min(1).max(10000),
        isInternal: z.boolean().default(false),
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
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { body, isInternal } = request.body;
      const authorId = request.user.sub;

      try {
        const replyTicketUseCase = makeReplyTicketUseCase();
        const { message } = await replyTicketUseCase.execute({
          ticketId: id,
          authorId,
          body,
          isInternal,
        });

        return reply.status(201).send({ message });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
