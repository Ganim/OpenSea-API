import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { PrismaCompanyAnnouncementsRepository } from '@/repositories/hr/prisma/prisma-company-announcements-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteAnnouncementController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/announcements/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ANNOUNCEMENTS.REMOVE,
        resource: 'announcements',
      }),
    ],
    schema: {
      tags: ['HR - Announcements'],
      summary: 'Delete an announcement',
      description: 'Permanently removes a company announcement',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id: announcementId } = request.params;

      const announcementsRepository =
        new PrismaCompanyAnnouncementsRepository();
      const announcement = await announcementsRepository.findById(
        new UniqueEntityID(announcementId),
        tenantId,
      );

      if (!announcement) {
        return reply.status(404).send({ message: 'Announcement not found' });
      }

      await announcementsRepository.delete(
        new UniqueEntityID(announcementId),
        tenantId,
      );

      await logAudit(request, {
        message: AUDIT_MESSAGES.HR.ANNOUNCEMENT_DELETE,
        entityId: announcementId,
        placeholders: {
          userName: userId,
          announcementTitle: announcement.title,
        },
      });

      return reply.status(204).send();
    },
  });
}
