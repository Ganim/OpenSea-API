import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeMarkAnnouncementReadUseCase } from '@/use-cases/hr/announcements/factories/make-mark-announcement-read-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1MarkAnnouncementReadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/announcements/:id/read',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ANNOUNCEMENTS.ACCESS,
        resource: 'announcements',
      }),
    ],
    schema: {
      tags: ['HR - Announcements'],
      summary: 'Mark announcement as read by current employee',
      description:
        'Idempotent — registers a read receipt for the announcement on behalf of the employee linked to the authenticated user.',
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          receipt: z.object({
            announcementId: z.string(),
            employeeId: z.string(),
            readAt: z.date(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id: announcementId } = request.params;

      try {
        const markAnnouncementReadUseCase = makeMarkAnnouncementReadUseCase();
        const { receipt } = await markAnnouncementReadUseCase.execute({
          tenantId,
          announcementId,
          userId,
        });

        return reply.status(200).send({
          receipt: {
            announcementId: receipt.announcementId.toString(),
            employeeId: receipt.employeeId.toString(),
            readAt: receipt.readAt,
          },
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
