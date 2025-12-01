import { verifyJwt } from '@/http/middlewares/verify-jwt';
import {
  employeeResponseSchema,
  listEmployeesQuerySchema,
  paginationMetaSchema,
} from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeListEmployeesUseCase } from '@/use-cases/hr/employees/factories/make-list-employees-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listEmployeesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Employees'],
      summary: 'List all employees',
      description:
        'Returns a paginated list of employees with optional filters',
      querystring: listEmployeesQuerySchema,
      response: {
        200: z.object({
          employees: z.array(employeeResponseSchema),
          meta: paginationMetaSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const {
        page,
        perPage,
        status,
        departmentId,
        positionId,
        supervisorId,
        search,
      } = request.query;

      const listEmployeesUseCase = makeListEmployeesUseCase();
      const { employees, meta } = await listEmployeesUseCase.execute({
        page,
        perPage,
        status,
        departmentId,
        positionId,
        supervisorId,
        search,
      });

      return reply.status(200).send({
        employees: employees.map(employeeToDTO),
        meta,
      });
    },
  });
}
