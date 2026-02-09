import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  departmentResponseSchema,
  listDepartmentsQuerySchema,
  paginationMetaSchema,
} from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import { departmentToDTO } from '@/mappers/hr/department/department-to-dto';
import { makeListDepartmentsUseCase } from '@/use-cases/hr/departments/factories/make-list-departments-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listDepartmentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/departments',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Departments'],
      summary: 'List all departments',
      description:
        'Returns a paginated list of departments with optional filters',
      querystring: listDepartmentsQuerySchema,
      response: {
        200: z.object({
          departments: z.array(departmentResponseSchema),
          meta: paginationMetaSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, perPage, search, isActive, parentId, companyId } =
        request.query;

      const listDepartmentsUseCase = makeListDepartmentsUseCase();
      const { departments, meta } = await listDepartmentsUseCase.execute({
        tenantId,
        page,
        perPage,
        search,
        isActive,
        parentId,
        companyId,
      });

      // Fetch _count for positions and employees per department
      const ids = departments.map((d) => d.id.toString());
      const countsData = ids.length > 0
        ? await prisma.department.findMany({
            where: { id: { in: ids } },
            select: {
              id: true,
              _count: { select: { positions: true, employees: true } },
            },
          })
        : [];
      const countMap = new Map(countsData.map((d) => [d.id, d._count]));

      return reply.status(200).send({
        departments: departments.map((d) => ({
          ...departmentToDTO(d),
          _count: countMap.get(d.id.toString()) ?? { positions: 0, employees: 0 },
        })),
        meta,
      });
    },
  });
}
