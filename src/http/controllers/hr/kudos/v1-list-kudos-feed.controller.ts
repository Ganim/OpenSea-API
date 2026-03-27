import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeKudosToDTO } from '@/mappers/hr/employee-kudos';
import { makeListKudosFeedUseCase } from '@/use-cases/hr/kudos/factories/make-list-kudos-feed-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListKudosFeedController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/kudos/feed',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Kudos'],
      summary: 'Public kudos feed',
      description: 'Returns a paginated feed of public kudos across the tenant',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
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
              createdAt: z.date(),
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
      const { page, limit } = request.query;

      const listKudosFeedUseCase = makeListKudosFeedUseCase();
      const { kudos, total } = await listKudosFeedUseCase.execute({
        tenantId,
        page,
        limit,
      });

      return reply.status(200).send({
        kudos: kudos.map(employeeKudosToDTO),
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
