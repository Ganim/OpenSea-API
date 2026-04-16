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
      description:
        'Returns a paginated list of active company announcements. Each item is enriched with `isReadByMe`, `readCount` and `audienceCount`.',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        unreadOnly: z.coerce.boolean().optional(),
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
              audienceTargets: z.object({
                departments: z.array(z.string()).optional(),
                teams: z.array(z.string()).optional(),
                roles: z.array(z.string()).optional(),
                employees: z.array(z.string()).optional(),
              }),
              isActive: z.boolean(),
              createdAt: z.date(),
              updatedAt: z.date(),
              isReadByMe: z.boolean(),
              readCount: z.number(),
              audienceCount: z.number(),
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
      const userId = request.user.sub;
      const { page, limit, unreadOnly } = request.query;

      const listAnnouncementsUseCase = makeListAnnouncementsUseCase();
      const { items, total } = await listAnnouncementsUseCase.execute({
        tenantId,
        page,
        limit,
        unreadOnly,
        currentUserId: userId,
      });

      return reply.status(200).send({
        announcements: items.map((item) => ({
          ...companyAnnouncementToDTO(item.announcement),
          isReadByMe: item.isReadByMe,
          readCount: item.readCount,
          audienceCount: item.audienceCount,
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
