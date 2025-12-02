import { verifyJwt } from '@/http/middlewares/verify-jwt';
import {
  departmentResponseSchema,
  listDepartmentsQuerySchema,
  paginationMetaSchema,
} from '@/http/schemas';
import { departmentToDTO } from '@/mappers/hr/department/department-to-dto';
import { makeListDepartmentsUseCase } from '@/use-cases/hr/departments/factories/make-list-departments-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listDepartmentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/departments',
    preHandler: [verifyJwt],
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
      const { page, perPage, search, isActive, parentId } = request.query;

      const listDepartmentsUseCase = makeListDepartmentsUseCase();
      const { departments, meta } = await listDepartmentsUseCase.execute({
        page,
        perPage,
        search,
        isActive,
        parentId,
      });

      return reply.status(200).send({
        departments: departments.map(departmentToDTO),
        meta,
      });
    },
  });
}
