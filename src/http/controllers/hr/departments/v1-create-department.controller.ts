import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createDepartmentSchema,
  departmentResponseSchema,
} from '@/http/schemas';
import { departmentToDTO } from '@/mappers/hr/department/department-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateDepartmentUseCase } from '@/use-cases/hr/departments/factories/make-create-department-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createDepartmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/departments',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.DEPARTMENTS.CREATE,
        resource: 'departments',
      }),
    ],
    schema: {
      tags: ['HR - Departments'],
      summary: 'Create a new department',
      description: 'Creates a new department in the organization structure',
      body: createDepartmentSchema,
      response: {
        201: z.object({
          department: departmentResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const createDepartmentUseCase = makeCreateDepartmentUseCase();
        const { department } = await createDepartmentUseCase.execute({
          name: data.name,
          code: data.code,
          description: data.description,
          parentId: data.parentId ?? undefined,
          managerId: data.managerId ?? undefined,
          companyId: data.companyId,
          isActive: data.isActive,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.DEPARTMENT_CREATE,
          entityId: department.id.toString(),
          placeholders: { userName, departmentName: department.name },
          newData: {
            name: data.name,
            code: data.code,
            companyId: data.companyId,
          },
        });

        return reply.status(201).send({
          department: departmentToDTO(department),
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
