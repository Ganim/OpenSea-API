import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteEmployeePhotoController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/employees/:id/photo',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.UPDATE,
        resource: 'employees',
      }),
    ],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Delete employee photo',
      params: z.object({
        id: z.string().uuid(),
      }),
      security: [{ bearerAuth: [] }],
      response: {
        204: z.null().describe('Photo deleted successfully'),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: employeeId } = request.params;

      const employeesRepo = new PrismaEmployeesRepository();
      const employee = await employeesRepo.findById(
        new UniqueEntityID(employeeId),
        tenantId,
      );

      if (!employee) {
        return reply
          .status(404)
          .send({ message: 'Funcionário não encontrado' });
      }

      // Soft-delete the storage file
      try {
        const storageFile = await prisma.storageFile.findFirst({
          where: {
            tenantId,
            entityType: 'employee-photo',
            entityId: employeeId,
            deletedAt: null,
          },
        });
        if (storageFile) {
          await prisma.storageFile.update({
            where: { id: storageFile.id },
            data: { deletedAt: new Date() },
          });
        }
      } catch {
        // Ignore cleanup errors
      }

      // Clear photoUrl
      await employeesRepo.update({
        id: employee.id,
        photoUrl: null,
      });

      // Clear linked user avatar
      if (employee.userId) {
        try {
          await prisma.userProfile.updateMany({
            where: { userId: employee.userId.toString() },
            data: { avatarUrl: '' },
          });
        } catch {
          // Non-critical
        }
      }

      await logAudit(request, {
        message: AUDIT_MESSAGES.HR.EMPLOYEE_UPDATE,
        entityId: employeeId,
        placeholders: {
          userName: request.user.sub,
          employeeName: employee.fullName,
        },
        oldData: { photoUrl: employee.photoUrl },
        newData: { photoUrl: null, operation: 'photo-delete' },
      });

      return reply.status(204).send(null);
    },
  });
}
