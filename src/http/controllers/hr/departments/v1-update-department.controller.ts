import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  departmentResponseSchema,
  updateDepartmentSchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { departmentToDTO } from '@/mappers/hr/department/department-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetDepartmentByIdUseCase } from '@/use-cases/hr/departments/factories/make-get-department-by-id-use-case';
import { makeUpdateDepartmentUseCase } from '@/use-cases/hr/departments/factories/make-update-department-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateDepartmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/departments/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.DEPARTMENTS.UPDATE,
        resource: 'departments',
      }),
    ],
    schema: {
      tags: ['HR - Departments'],
      summary: 'Update a department',
      description: 'Updates an existing department',
      params: z.object({
        id: idSchema,
      }),
      body: updateDepartmentSchema,
      response: {
        200: z.object({
          department: departmentResponseSchema,
        }),
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
      const { id } = request.params;
      const data = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getDepartmentByIdUseCase = makeGetDepartmentByIdUseCase();

        const [{ user }, { department: oldDepartment }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getDepartmentByIdUseCase.execute({ id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const updateDepartmentUseCase = makeUpdateDepartmentUseCase();
        const { department } = await updateDepartmentUseCase.execute({
          id,
          name: data.name,
          code: data.code,
          description: data.description,
          parentId: data.parentId,
          managerId: data.managerId,
          isActive: data.isActive,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.DEPARTMENT_UPDATE,
          entityId: id,
          placeholders: { userName, departmentName: department.name },
          oldData: { name: oldDepartment.name, code: oldDepartment.code },
          newData: data,
        });

        return reply.status(200).send({
          department: departmentToDTO(department),
        });
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
