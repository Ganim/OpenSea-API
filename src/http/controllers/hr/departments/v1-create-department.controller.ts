import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createDepartmentSchema,
  departmentResponseSchema,
} from '@/http/schemas';
import { departmentToDTO } from '@/mappers/hr/department/department-to-dto';
import { makeCreateDepartmentUseCase } from '@/use-cases/hr/departments/factories/make-create-department-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createDepartmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/departments',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.DEPARTMENTS.CREATE,
        resource: 'departments',
      }),
    ],
    schema: {
      tags: ['HR - Departments'],
      summary: 'Create a new department',
      description: 'Creates a new department in the organization structure',
      body: createDepartmentSchema,
      response: {
        201: z.object({
          department: departmentResponseSchema,
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
        const createDepartmentUseCase = makeCreateDepartmentUseCase();
        const { department } = await createDepartmentUseCase.execute({
          name: data.name,
          code: data.code,
          description: data.description,
          parentId: data.parentId ?? undefined,
          managerId: data.managerId ?? undefined,
          companyId: data.companyId,
          isActive: data.isActive,
        });

        return reply.status(201).send({
          department: departmentToDTO(department),
        });
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
