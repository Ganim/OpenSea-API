import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  employeeResponseSchema,
  terminateEmployeeSchema,
} from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeTerminateEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-terminate-employee-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function terminateEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:employeeId/terminate',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Terminate an employee',
      description: 'Terminates an employee and sets their termination date',
      params: z.object({
        employeeId: z.string().uuid(),
      }),
      body: terminateEmployeeSchema,
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
      const { terminationDate, reason } = request.body;

      try {
        const terminateEmployeeUseCase = makeTerminateEmployeeUseCase();
        const { employee } = await terminateEmployeeUseCase.execute({
          employeeId,
          terminationDate,
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
