import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { companyAnnouncementToDTO } from '@/mappers/hr/company-announcement';
import { makeUpdateAnnouncementUseCase } from '@/use-cases/hr/announcements/factories/make-update-announcement-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateAnnouncementController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/announcements/:id',
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
      summary: 'Update an announcement',
      description: 'Updates an existing company announcement',
      params: z.object({
        id: z.string(),
      }),
      body: z.object({
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional(),
        expiresAt: z.coerce.date().optional(),
        targetDepartmentIds: z.array(z.string()).optional(),
        targetTeamIds: z.array(z.string()).optional(),
        targetRoleIds: z.array(z.string()).optional(),
        targetEmployeeIds: z.array(z.string()).optional(),
      }),
      response: {
        200: z.object({
          announcement: z.object({
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
        const updateAnnouncementUseCase = makeUpdateAnnouncementUseCase();
        const { announcement } = await updateAnnouncementUseCase.execute({
          tenantId,
          announcementId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ANNOUNCEMENT_UPDATE,
          entityId: announcement.id.toString(),
          placeholders: {
            userName: userId,
            announcementTitle: announcement.title,
          },
          newData: request.body as Record<string, unknown>,
        });

        return reply.status(200).send({
          announcement: companyAnnouncementToDTO(announcement),
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
