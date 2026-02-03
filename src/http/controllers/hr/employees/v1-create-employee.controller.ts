import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createEmployeeSchema, employeeResponseSchema } from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeCreateEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-create-employee-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.CREATE,
        resource: 'employees',
      }),
    ],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Create a new employee',
      description: 'Creates a new employee record in the system',
      body: createEmployeeSchema,
      response: {
        201: z.object({
          employee: employeeResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;
      const tenantId = request.user.tenantId!;

      try {
        const createEmployeeUseCase = makeCreateEmployeeUseCase();
        const { employee } = await createEmployeeUseCase.execute({
          tenantId,
          ...data,
        });

        // Auditoria de criação de funcionário
        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_CREATE,
          entityId: employee.id.toString(),
          placeholders: {
            adminName: request.user?.sub || 'Sistema',
            employeeName: employee.socialName || employee.fullName,
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(201).send({ employee: employeeToDTO(employee) });
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
