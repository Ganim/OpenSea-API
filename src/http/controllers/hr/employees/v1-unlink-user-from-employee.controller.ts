import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeResponseSchema } from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function unlinkUserFromEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:employeeId/unlink-user',
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
      summary: 'Unlink user from employee',
      description: 'Removes the user link from an employee record',
      params: z.object({
        employeeId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          employee: employeeResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { employeeId } = request.params;
      const tenantId = request.user.tenantId!;

      const employeesRepository = new PrismaEmployeesRepository();

      const existing = await employeesRepository.findById(
        new UniqueEntityID(employeeId),
        tenantId,
      );

      if (!existing) {
        return reply.status(404).send({ message: 'Employee not found' });
      }

      const updated = await employeesRepository.update({
        id: new UniqueEntityID(employeeId),
        userId: null,
      });

      if (!updated) {
        return reply.status(404).send({ message: 'Failed to update employee' });
      }

      return reply.status(200).send({ employee: employeeToDTO(updated) });
    },
  });
}
