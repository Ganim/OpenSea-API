import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetTicketUseCase } from '@/use-cases/admin/support/factories/make-get-ticket-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getTicketAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/support/tickets/:id',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Support'],
      summary: 'Get support ticket details (super admin)',
      description:
        'Returns detailed ticket information including messages and attachments. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          ticket: z.object({
            id: z.string(),
            ticketNumber: z.number(),
            tenantId: z.string(),
            creatorId: z.string(),
            assigneeId: z.string().nullable(),
            title: z.string(),
            category: z.string(),
            priority: z.string(),
            status: z.string(),
            resolvedAt: z.coerce.date().nullable(),
            closedAt: z.coerce.date().nullable(),
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date(),
          }),
          messages: z.array(
            z.object({
              id: z.string(),
              ticketId: z.string(),
              authorId: z.string().nullable(),
              authorType: z.string(),
              body: z.string(),
              isInternal: z.boolean(),
              createdAt: z.coerce.date(),
            }),
          ),
          attachments: z.array(
            z.object({
              id: z.string(),
              ticketId: z.string(),
              fileName: z.string(),
              fileUrl: z.string(),
              fileSize: z.number(),
              mimeType: z.string(),
              createdAt: z.coerce.date(),
            }),
          ),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getTicketUseCase = makeGetTicketUseCase();
        const { ticket, messages, attachments } =
          await getTicketUseCase.execute({ ticketId: id });

        return reply.status(200).send({ ticket, messages, attachments });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
