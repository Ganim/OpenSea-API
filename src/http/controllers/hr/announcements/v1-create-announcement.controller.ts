import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { companyAnnouncementToDTO } from '@/mappers/hr/company-announcement';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeCreateAnnouncementUseCase } from '@/use-cases/hr/announcements/factories/make-create-announcement-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateAnnouncementController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/announcements',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ANNOUNCEMENTS.REGISTER,
        resource: 'announcements',
      }),
    ],
    schema: {
      tags: ['HR - Announcements'],
      summary: 'Create a company announcement',
      description: 'Creates a new company announcement visible to employees',
      body: z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).default('NORMAL'),
        expiresAt: z.coerce.date().optional(),
        targetDepartmentIds: z.array(z.string()).optional(),
        targetTeamIds: z.array(z.string()).optional(),
        targetRoleIds: z.array(z.string()).optional(),
        targetEmployeeIds: z.array(z.string()).optional(),
        publishNow: z.boolean().default(true),
      }),
      response: {
        201: z.object({
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
          notificationsCreated: z.number(),
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const {
        title,
        content,
        priority,
        expiresAt,
        targetDepartmentIds,
        targetTeamIds,
        targetRoleIds,
        targetEmployeeIds,
        publishNow,
      } = request.body;

      // Resolve author employee (optional, may not have employee linked)
      const employeesRepository = new PrismaEmployeesRepository();
      const authorEmployee = await employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

      try {
        const createAnnouncementUseCase = makeCreateAnnouncementUseCase();
        const { announcement, notificationsCreated } =
          await createAnnouncementUseCase.execute({
            tenantId,
            title,
            content,
            priority,
            expiresAt,
            authorEmployeeId: authorEmployee?.id.toString(),
            targetDepartmentIds,
            targetTeamIds,
            targetRoleIds,
            targetEmployeeIds,
            publishNow,
          });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ANNOUNCEMENT_CREATE,
          entityId: announcement.id.toString(),
          placeholders: { userName: userId, announcementTitle: title },
          newData: {
            title,
            priority,
            targetDepartmentIds,
            targetTeamIds,
            targetRoleIds,
            targetEmployeeIds,
          },
        });

        return reply.status(201).send({
          announcement: companyAnnouncementToDTO(announcement),
          notificationsCreated,
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
