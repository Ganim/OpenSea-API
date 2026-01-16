import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { createScopeIdentifierMiddleware } from '@/http/middlewares/rbac/verify-scope';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
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

/**
 * Middleware para verificar permissão de listagem de funcionários
 * Aceita hr.employees.list.all ou hr.employees.list.team
 */
const checkEmployeesListScope = createScopeIdentifierMiddleware('hr.employees.list');

export async function listEmployeesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees',
    preHandler: [verifyJwt, checkEmployeesListScope],
    schema: {
      tags: ['HR - Employees'],
      summary: 'List employees (scope-based)',
      description:
        'Returns a paginated list of employees. With hr.employees.list.all permission, returns all employees. With hr.employees.list.team, returns only employees from the same department.',
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
        companyId,
        search,
        includeDeleted,
      } = request.query;

      // Se o usuário tem apenas escopo .team, força o filtro por departamento
      const scopeCheck = request.scopeCheck;
      const effectiveDepartmentId =
        scopeCheck?.scope === 'team' && scopeCheck.userDepartmentId
          ? scopeCheck.userDepartmentId
          : departmentId;

      const listEmployeesUseCase = makeListEmployeesUseCase();
      const { employees, meta } = await listEmployeesUseCase.execute({
        page,
        perPage,
        status,
        departmentId: effectiveDepartmentId,
        positionId,
        supervisorId,
        companyId,
        search,
        includeDeleted,
      });

      return reply.status(200).send({
        employees: employees.map(employeeToDTO),
        meta,
      });
    },
  });
}
