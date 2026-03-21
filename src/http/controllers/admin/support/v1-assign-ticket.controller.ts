import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeAssignTicketUseCase } from '@/use-cases/admin/support/factories/make-assign-ticket-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function assignTicketAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/support/tickets/:id/assign',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Support'],
      summary: 'Assign a support ticket (super admin)',
      description:
        'Assigns a support ticket to a Central team member. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        assigneeId: z.string().uuid(),
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
      const { assigneeId } = request.body;

      try {
        const assignTicketUseCase = makeAssignTicketUseCase();
        const { ticket } = await assignTicketUseCase.execute({
          ticketId: id,
          assigneeId,
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
