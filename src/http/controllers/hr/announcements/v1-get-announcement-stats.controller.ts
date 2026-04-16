import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetAnnouncementStatsUseCase } from '@/use-cases/hr/announcements/factories/make-get-announcement-stats-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetAnnouncementStatsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/announcements/:id/stats',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ANNOUNCEMENTS.MODIFY,
        resource: 'announcements',
      }),
    ],
    schema: {
      tags: ['HR - Announcements'],
      summary: 'Get announcement read statistics',
      description:
        'Returns aggregate read metrics for the announcement: totalAudience, readCount, unreadCount, readPercentage and the latest readers.',
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          totalAudience: z.number(),
          readCount: z.number(),
          unreadCount: z.number(),
          readPercentage: z.number(),
          recentReaders: z.array(
            z.object({
              employeeId: z.string(),
              fullName: z.string(),
              photoUrl: z.string().nullable(),
              readAt: z.date(),
            }),
          ),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: announcementId } = request.params;

      try {
        const getAnnouncementStatsUseCase = makeGetAnnouncementStatsUseCase();
        const stats = await getAnnouncementStatsUseCase.execute({
          tenantId,
          announcementId,
        });

        return reply.status(200).send({
          totalAudience: stats.totalAudience,
          readCount: stats.readCount,
          unreadCount: stats.unreadCount,
          readPercentage: stats.readPercentage,
          recentReaders: stats.recentReaders.map((entry) => ({
            employeeId: entry.employee.id.toString(),
            fullName: entry.employee.fullName,
            photoUrl: entry.employee.photoUrl ?? null,
            readAt: entry.readAt,
          })),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
