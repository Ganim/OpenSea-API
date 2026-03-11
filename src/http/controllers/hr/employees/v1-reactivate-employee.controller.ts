import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeResponseSchema } from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import { makeReactivateEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-reactivate-employee-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ReactivateEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/employees/:employeeId/reactivate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.MANAGE,
        resource: 'employees',
      }),
    ],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Reactivate an employee',
      description: 'Reactivates a suspended or on-leave employee',
      params: z.object({
        employeeId: z.string().uuid(),
      }),
      response: {
        200: z.object({ employee: employeeResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { employeeId } = request.params;
      const adminId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getEmployeeByIdUseCase = makeGetEmployeeByIdUseCase();

        const [{ user: admin }, { employee: oldEmployee }] = await Promise.all([
          getUserByIdUseCase.execute({ userId: adminId }),
          getEmployeeByIdUseCase.execute({ tenantId, employeeId }),
        ]);
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const reactivateEmployeeUseCase = makeReactivateEmployeeUseCase();
        const { employee } = await reactivateEmployeeUseCase.execute({
          tenantId,
          employeeId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_REACTIVATE,
          entityId: employeeId,
          placeholders: { adminName, employeeName: oldEmployee.fullName },
          oldData: { status: oldEmployee.status.value },
          newData: { status: 'ACTIVE' },
        });

        return reply.status(200).send({ employee: employeeToDTO(employee) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
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
