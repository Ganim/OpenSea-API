import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createEmployeeWithUserResponseSchema,
  createEmployeeWithUserSchema,
} from '@/http/schemas/hr.schema';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateEmployeeWithUserUseCase } from '@/use-cases/hr/employees/factories/make-create-employee-with-user-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createEmployeeWithUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees-with-user',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.CREATE,
        resource: 'employees',
      }),
    ],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Create a new employee with user account',
      description:
        'Creates a new employee record along with a user account in a single operation',
      body: createEmployeeWithUserSchema,
      response: {
        201: createEmployeeWithUserResponseSchema,
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;
      const adminId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user: admin } = await getUserByIdUseCase.execute({
          userId: adminId,
        });
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const createEmployeeWithUserUseCase =
          makeCreateEmployeeWithUserUseCase();
        const { employee, user } =
          await createEmployeeWithUserUseCase.execute(data);

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_CREATE,
          entityId: employee.id.toString(),
          placeholders: { adminName, employeeName: employee.fullName },
          newData: {
            fullName: employee.fullName,
            cpf: data.cpf,
            email: data.email,
            positionId: data.positionId,
          },
        });

        return reply.status(201).send({
          employee: employeeToDTO(employee),
          user,
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
