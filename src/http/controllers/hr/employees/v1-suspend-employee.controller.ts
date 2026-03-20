import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeResponseSchema, suspendEmployeeSchema } from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import { makeSuspendEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-suspend-employee-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1SuspendEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/employees/:employeeId/suspend',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.ADMIN,
        resource: 'employees',
      }),
    ],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Suspend an employee',
      description: 'Suspends an active employee',
      params: z.object({
        employeeId: z.string().uuid(),
      }),
      body: suspendEmployeeSchema,
      response: {
        200: z.object({ employee: employeeResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { employeeId } = request.params;
      const { reason } = request.body;
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

        const suspendEmployeeUseCase = makeSuspendEmployeeUseCase();
        const { employee } = await suspendEmployeeUseCase.execute({
          tenantId,
          employeeId,
          reason,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_SUSPEND,
          entityId: employeeId,
          placeholders: { adminName, employeeName: oldEmployee.fullName },
          oldData: { status: oldEmployee.status.value },
          newData: { status: 'SUSPENDED', reason },
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
