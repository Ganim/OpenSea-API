import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreateTicketUseCase } from '@/use-cases/admin/tenant-support/factories/make-create-ticket-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createTicketController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/support/tickets',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Support'],
      summary: 'Create a support ticket',
      description:
        'Creates a new support ticket with an initial description message. Requires tenant context.',
      body: z.object({
        title: z.string().min(1).max(256),
        description: z.string().min(1).max(10000),
        category: z
          .enum(['BUG', 'QUESTION', 'REQUEST', 'FINANCIAL', 'OTHER'])
          .optional(),
      }),
      response: {
        201: z.object({
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
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { title, description, category } = request.body;
      const tenantId = request.user.tenantId!;
      const creatorId = request.user.sub;

      const createTicketUseCase = makeCreateTicketUseCase();
      const { ticket } = await createTicketUseCase.execute({
        tenantId,
        creatorId,
        title,
        description,
        category,
      });

      return reply.status(201).send({ ticket });
    },
  });
}
