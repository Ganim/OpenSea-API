import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteDepartmentUseCase } from '@/use-cases/hr/departments/factories/make-delete-department-use-case';
import { makeGetDepartmentByIdUseCase } from '@/use-cases/hr/departments/factories/make-get-department-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteDepartmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/departments/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.DEPARTMENTS.DELETE,
        resource: 'departments',
      }),
    ],
    schema: {
      tags: ['HR - Departments'],
      summary: 'Delete a department',
      description: 'Soft deletes a department (marks as deleted)',
      params: z.object({
        id: idSchema,
      }),
      response: {
        204: z.null(),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getDepartmentByIdUseCase = makeGetDepartmentByIdUseCase();

        const [{ user }, { department }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getDepartmentByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const deleteDepartmentUseCase = makeDeleteDepartmentUseCase();
        await deleteDepartmentUseCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.DEPARTMENT_DELETE,
          entityId: id,
          placeholders: { userName, departmentName: department.name },
          oldData: { id: department.id, name: department.name },
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          if (error.message === 'Department not found') {
            return reply.status(404).send({ message: error.message });
          }
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
