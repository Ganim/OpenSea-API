import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  regenerateEmployeeShortIdParamsSchema,
  regenerateEmployeeShortIdResponseSchema,
} from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import { makeRegenerateShortIdUseCase } from '@/use-cases/hr/employees/factories/make-regenerate-short-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Regenerates the public shortId of an employee (Crockford-like, 6 chars).
 *
 * Used by Emporion POS operator login flow when an employee's shortId needs
 * to be rotated (compromise, fat-finger leak, employee request). Protected
 * by `hr.employees.admin` permission and audited.
 */
export async function v1RegenerateEmployeeShortIdController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/employees/:employeeId/regenerate-short-id',
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
      summary: 'Regenerate employee public shortId',
      description:
        'Generates a new 6-character public shortId for an employee, used by the Emporion POS operator login flow. Requires hr.employees.admin permission.',
      params: regenerateEmployeeShortIdParamsSchema,
      response: {
        200: regenerateEmployeeShortIdResponseSchema,
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

        const regenerateShortIdUseCase = makeRegenerateShortIdUseCase();
        const { employee, previousShortId } =
          await regenerateShortIdUseCase.execute({
            tenantId,
            employeeId,
          });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_REGENERATE_SHORT_ID,
          entityId: employeeId,
          placeholders: {
            adminName,
            employeeName: oldEmployee.fullName,
          },
          oldData: { shortId: previousShortId },
          newData: { shortId: employee.shortId },
        });

        return reply.status(200).send({
          employee: employeeToDTO(employee),
          previousShortId,
        });
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
