import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createEmployeeWithUserResponseSchema,
  createEmployeeWithUserSchema,
} from '@/http/schemas/hr.schema';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
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

      try {
        const createEmployeeWithUserUseCase =
          makeCreateEmployeeWithUserUseCase();
        const { employee, user } =
          await createEmployeeWithUserUseCase.execute(data);

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
