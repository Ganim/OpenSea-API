import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeUpdateTicketStatusUseCase } from '@/use-cases/admin/support/factories/make-update-ticket-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateTicketStatusAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/admin/support/tickets/:id/status',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Support'],
      summary: 'Update support ticket status (super admin)',
      description:
        'Changes the status of a support ticket. Auto-sets resolvedAt and closedAt timestamps. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        status: z.enum([
          'OPEN',
          'IN_PROGRESS',
          'WAITING_CLIENT',
          'RESOLVED',
          'CLOSED',
        ]),
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
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { status } = request.body;

      try {
        const updateTicketStatusUseCase = makeUpdateTicketStatusUseCase();
        const { ticket } = await updateTicketStatusUseCase.execute({
          ticketId: id,
          status,
        });

        return reply.status(200).send({ ticket });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
