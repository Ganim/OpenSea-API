import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  employeeResponseSchema,
  linkUserToEmployeeSchema,
} from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeLinkUserToEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-link-user-to-employee-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function linkUserToEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:employeeId/link-user',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Link a user account to an employee',
      description:
        'Links an existing user account to an employee record for system access',
      params: z.object({
        employeeId: z.string().uuid(),
      }),
      body: linkUserToEmployeeSchema,
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
      const { userId } = request.body;

      try {
        const linkUserToEmployeeUseCase = makeLinkUserToEmployeeUseCase();
        const { employee } = await linkUserToEmployeeUseCase.execute({
          employeeId,
          userId,
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
