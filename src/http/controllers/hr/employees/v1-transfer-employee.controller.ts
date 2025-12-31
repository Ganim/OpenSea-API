import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { employeeResponseSchema, transferEmployeeSchema } from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeTransferEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-transfer-employee-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function transferEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:employeeId/transfer',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.MANAGE,
        resource: 'employees',
      }),
    ],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Transfer an employee',
      description:
        'Transfers an employee to a new department, position, or supervisor',
      params: z.object({
        employeeId: z.string().uuid(),
      }),
      body: transferEmployeeSchema,
      response: {
        200: z.object({
          employee: employeeResponseSchema,
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
      const { employeeId } = request.params;
      const {
        newDepartmentId,
        newPositionId,
        newSupervisorId,
        newBaseSalary,
        effectiveDate,
        reason,
      } = request.body;

      try {
        const transferEmployeeUseCase = makeTransferEmployeeUseCase();
        const { employee } = await transferEmployeeUseCase.execute({
          employeeId,
          newDepartmentId,
          newPositionId,
          newSupervisorId,
          newBaseSalary,
          effectiveDate,
          reason,
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
