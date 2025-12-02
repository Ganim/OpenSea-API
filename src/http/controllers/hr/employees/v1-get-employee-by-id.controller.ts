import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { employeeResponseSchema } from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getEmployeeByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees/:employeeId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Get an employee by ID',
      description: 'Returns a single employee by their ID',
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

      try {
        const getEmployeeByIdUseCase = makeGetEmployeeByIdUseCase();
        const { employee } = await getEmployeeByIdUseCase.execute({
          employeeId,
        });

        return reply.status(200).send({ employee: employeeToDTO(employee) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
