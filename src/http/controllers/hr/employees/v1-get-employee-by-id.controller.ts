import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { createScopeMiddleware } from '@/http/middlewares/rbac/verify-scope';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeResponseSchema } from '@/http/schemas';
import { employeeToDTOWithRelations } from '@/mappers/hr/employee/employee-to-dto';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Middleware para verificar permissão de leitura de funcionário
 * Com .all pode ver qualquer funcionário, com .team apenas do seu departamento
 */
const checkEmployeeReadScope = createScopeMiddleware({
  basePermissionCode: 'hr.employees.read',
  resource: 'employees',
  getResourceDepartmentId: async (request) => {
    const params = request.params as { employeeId: string };
    const tenantId = request.user.tenantId!;
    const getEmployeeByIdUseCase = makeGetEmployeeByIdUseCase();
    try {
      const { employee } = await getEmployeeByIdUseCase.execute({
        tenantId,
        employeeId: params.employeeId,
      });
      return employee.departmentId?.toString() ?? null;
    } catch {
      return null;
    }
  },
});

export async function getEmployeeByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees/:employeeId',
    preHandler: [verifyJwt, verifyTenant, checkEmployeeReadScope],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Get an employee by ID (scope-based)',
      description:
        'Returns a single employee by their ID. With hr.employees.read.all can view any employee. With hr.employees.read.team can only view employees from the same department.',
      params: z.object({
        employeeId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          employee: employeeResponseSchema,
        }),
        403: z.object({
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
      const tenantId = request.user.tenantId!;

      try {
        const employeesRepository = new PrismaEmployeesRepository();
        const result = await employeesRepository.findByIdWithRelations(
          new UniqueEntityID(employeeId),
          tenantId,
        );

        if (!result) {
          return reply
            .status(404)
            .send({ message: 'Employee not found' });
        }

        return reply.status(200).send({
          employee: employeeToDTOWithRelations(
            result.employee,
            result.rawRelations,
          ),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
