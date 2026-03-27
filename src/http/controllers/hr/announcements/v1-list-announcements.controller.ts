import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { companyAnnouncementToDTO } from '@/mappers/hr/company-announcement';
import { makeListAnnouncementsUseCase } from '@/use-cases/hr/announcements/factories/make-list-announcements-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListAnnouncementsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/announcements',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Announcements'],
      summary: 'List active announcements',
      description: 'Returns a paginated list of active company announcements',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
      }),
      response: {
        200: z.object({
          announcements: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              content: z.string(),
              priority: z.string(),
              publishedAt: z.date().nullable(),
              expiresAt: z.date().nullable(),
              authorEmployeeId: z.string().nullable(),
              targetDepartmentIds: z.array(z.string()).nullable(),
              isActive: z.boolean(),
              createdAt: z.date(),
              updatedAt: z.date(),
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

      const listAnnouncementsUseCase = makeListAnnouncementsUseCase();
      const { announcements, total } = await listAnnouncementsUseCase.execute({
        tenantId,
        page,
        limit,
      });

      return reply.status(200).send({
        announcements: announcements.map(companyAnnouncementToDTO),
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
