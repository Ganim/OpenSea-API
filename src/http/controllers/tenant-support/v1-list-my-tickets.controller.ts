import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListMyTicketsUseCase } from '@/use-cases/admin/tenant-support/factories/make-list-my-tickets-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listMyTicketsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/support/tickets',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Support'],
      summary: 'List my support tickets',
      description:
        'Lists support tickets created by the current user in their tenant. Requires tenant context.',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1).optional(),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .default(20)
          .optional(),
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
      const tenantId = request.user.tenantId!;
      const creatorId = request.user.sub;

      const listMyTicketsUseCase = makeListMyTicketsUseCase();
      const { tickets, meta } = await listMyTicketsUseCase.execute({
        tenantId,
        creatorId,
        page,
        perPage,
      });

      return reply.status(200).send({ tickets, meta });
    },
  });
}
