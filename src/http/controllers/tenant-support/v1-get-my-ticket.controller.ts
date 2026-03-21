import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetMyTicketUseCase } from '@/use-cases/admin/tenant-support/factories/make-get-my-ticket-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getMyTicketController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/support/tickets/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Support'],
      summary: 'Get my support ticket details',
      description:
        'Returns ticket details with messages (excluding internal notes) and attachments. Requires tenant context.',
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
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const getMyTicketUseCase = makeGetMyTicketUseCase();
        const { ticket, messages, attachments } =
          await getMyTicketUseCase.execute({
            ticketId: id,
            tenantId,
            userId,
          });

        return reply.status(200).send({ ticket, messages, attachments });
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
