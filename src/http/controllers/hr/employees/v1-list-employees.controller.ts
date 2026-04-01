import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { createAnyPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  employeeResponseSchema,
  listEmployeesQuerySchema,
  paginationMetaSchema,
} from '@/http/schemas';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeListEmployeesUseCase } from '@/use-cases/hr/employees/factories/make-list-employees-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const checkEmployeesAccess = createAnyPermissionMiddleware([
  PermissionCodes.HR.EMPLOYEES.ACCESS,
  PermissionCodes.HR.EMPLOYEES.ONLYSELF,
]);

export async function v1ListEmployeesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees',
    preHandler: [verifyJwt, verifyTenant, checkEmployeesAccess],
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
        unlinked,
        includeDeleted,
      } = request.query;

      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      // Check if user has full ACCESS or only ONLYSELF
      const permissionService = getPermissionService();
      const accessResult = await permissionService.checkPermission({
        userId: new UniqueEntityID(userId),
        permissionCode: PermissionCodes.HR.EMPLOYEES.ACCESS,
      });
      const hasFullAccess = accessResult.allowed;

      const listEmployeesUseCase = makeListEmployeesUseCase();
      const { employees, meta } = await listEmployeesUseCase.execute({
        tenantId,
        page,
        perPage,
        status,
        departmentId,
        positionId,
        supervisorId,
        companyId,
        // If user only has ONLYSELF, filter to their own employee record
        userId: hasFullAccess ? undefined : userId,
        search,
        unlinked,
        includeDeleted,
      });

      return reply.status(200).send({
        employees: employees.map(employeeToDTO),
        meta,
      });
    },
  });
}
