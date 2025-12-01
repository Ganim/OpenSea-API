import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
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
    preHandler: [verifyJwt, verifyUserManager],
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

      try {
        const createEmployeeUseCase = makeCreateEmployeeUseCase();
        const { employee } = await createEmployeeUseCase.execute(data);

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
