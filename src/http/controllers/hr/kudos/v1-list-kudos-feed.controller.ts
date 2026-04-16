import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeKudosToDTO } from '@/mappers/hr/employee-kudos';
import { makeListKudosFeedUseCase } from '@/use-cases/hr/kudos/factories/make-list-kudos-feed-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const reactionSummarySchema = z.array(
  z.object({
    emoji: z.string(),
    count: z.number().int().nonnegative(),
    employeeIds: z.array(z.string()),
  }),
);

export async function v1ListKudosFeedController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/kudos/feed',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Kudos'],
      summary: 'Public kudos feed',
      description:
        'Returns a paginated feed of public kudos across the tenant. Each item is enriched with reactions summary, replies count and pinned flag. Pinned kudos are returned first.',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        pinned: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          kudos: z.array(
            z.object({
              id: z.string(),
              fromEmployeeId: z.string(),
              toEmployeeId: z.string(),
              message: z.string(),
              category: z.string(),
              isPublic: z.boolean(),
              isPinned: z.boolean(),
              pinnedAt: z.date().nullable(),
              pinnedBy: z.string().nullable(),
              createdAt: z.date(),
              reactionsSummary: reactionSummarySchema,
              repliesCount: z.number().int().nonnegative(),
            }),
          ),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, pinned } = request.query;

      const listKudosFeedUseCase = makeListKudosFeedUseCase();
      const { items, total } = await listKudosFeedUseCase.execute({
        tenantId,
        page,
        limit,
        pinned,
      });

      return reply.status(200).send({
        kudos: items.map((item) => ({
          ...employeeKudosToDTO(item.kudos),
          reactionsSummary: item.reactionsSummary.slice(0, 5),
          repliesCount: item.repliesCount,
        })),
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    },
  });
}
