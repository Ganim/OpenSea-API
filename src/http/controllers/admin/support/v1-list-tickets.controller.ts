import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeListTicketsUseCase } from '@/use-cases/admin/support/factories/make-list-tickets-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listTicketsAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/support/tickets',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Support'],
      summary: 'List all support tickets (super admin)',
      description:
        'Lists all support tickets with optional filters. Requires super admin privileges.',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1).optional(),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .default(20)
          .optional(),
        tenantId: z.string().uuid().optional(),
        status: z
          .enum(['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'])
          .optional(),
        priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
        category: z
          .enum(['BUG', 'QUESTION', 'REQUEST', 'FINANCIAL', 'OTHER'])
          .optional(),
        assigneeId: z.string().uuid().optional(),
        search: z.string().optional(),
      }),
      response: {
        200: z.object({
          tickets: z.array(
            z.object({
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
          ),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            perPage: z.number(),
            totalPages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const page = request.query.page ?? 1;
      const perPage = request.query.limit ?? 20;
      const { tenantId, status, priority, category, assigneeId, search } =
        request.query;

      const listTicketsUseCase = makeListTicketsUseCase();
      const { tickets, meta } = await listTicketsUseCase.execute({
        page,
        perPage,
        tenantId,
        status,
        priority,
        category,
        assigneeId,
        search,
      });

      return reply.status(200).send({ tickets, meta });
    },
  });
}
