import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  departmentResponseSchema,
  updateDepartmentSchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { departmentToDTO } from '@/mappers/hr/department/department-to-dto';
import { makeUpdateDepartmentUseCase } from '@/use-cases/hr/departments/factories/make-update-department-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateDepartmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/departments/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Departments'],
      summary: 'Update a department',
      description: 'Updates an existing department',
      params: z.object({
        id: idSchema,
      }),
      body: updateDepartmentSchema,
      response: {
        200: z.object({
          department: departmentResponseSchema,
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
      const { id } = request.params;
      const data = request.body;

      try {
        const updateDepartmentUseCase = makeUpdateDepartmentUseCase();
        const { department } = await updateDepartmentUseCase.execute({
          id,
          name: data.name,
          code: data.code,
          description: data.description,
          parentId: data.parentId,
          managerId: data.managerId,
          isActive: data.isActive,
        });

        return reply.status(200).send({
          department: departmentToDTO(department),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          if (error.message === 'Department not found') {
            return reply.status(404).send({ message: error.message });
          }
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
