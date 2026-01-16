import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { createScopeMiddleware } from '@/http/middlewares/rbac/verify-scope';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { employeeResponseSchema, updateEmployeeSchema } from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import { makeUpdateEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-update-employee-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Middleware para verificar permissão de atualização de funcionário
 * Com .all pode atualizar qualquer funcionário, com .team apenas do seu departamento
 */
const checkEmployeeUpdateScope = createScopeMiddleware({
  basePermissionCode: 'hr.employees.update',
  resource: 'employees',
  getResourceDepartmentId: async (request) => {
    const params = request.params as { employeeId: string };
    const getEmployeeByIdUseCase = makeGetEmployeeByIdUseCase();
    try {
      const { employee } = await getEmployeeByIdUseCase.execute({
        employeeId: params.employeeId,
      });
      return employee.departmentId?.toString() ?? null;
    } catch {
      return null;
    }
  },
});

export async function updateEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/employees/:employeeId',
    preHandler: [verifyJwt, checkEmployeeUpdateScope],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Update an employee (scope-based)',
      description:
        'Updates an existing employee record. With hr.employees.update.all can update any employee. With hr.employees.update.team can only update employees from the same department.',
      params: z.object({
        employeeId: z.string().uuid(),
      }),
      body: updateEmployeeSchema,
      response: {
        200: z.object({
          employee: employeeResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        403: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { employeeId } = request.params;
      const data = request.body;
      const adminId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getEmployeeByIdUseCase = makeGetEmployeeByIdUseCase();

        const [{ user: admin }, { employee: oldEmployee }] = await Promise.all([
          getUserByIdUseCase.execute({ userId: adminId }),
          getEmployeeByIdUseCase.execute({ employeeId }),
        ]);
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const updateEmployeeUseCase = makeUpdateEmployeeUseCase();
        const { employee } = await updateEmployeeUseCase.execute({
          employeeId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_UPDATE,
          entityId: employeeId,
          placeholders: { adminName, employeeName: employee.fullName },
          oldData: {
            fullName: oldEmployee.fullName,
            positionId: oldEmployee.positionId,
          },
          newData: data,
        });

        return reply.status(200).send({ employee: employeeToDTO(employee) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
