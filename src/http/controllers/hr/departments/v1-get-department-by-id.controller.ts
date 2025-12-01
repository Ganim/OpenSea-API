import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { departmentResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { departmentToDTO } from '@/mappers/hr/department/department-to-dto';
import { makeGetDepartmentByIdUseCase } from '@/use-cases/hr/departments/factories/make-get-department-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getDepartmentByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/departments/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Departments'],
      summary: 'Get department by ID',
      description: 'Returns a department by its ID',
      params: z.object({
        id: idSchema,
      }),
      response: {
        200: z.object({
          department: departmentResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getDepartmentByIdUseCase = makeGetDepartmentByIdUseCase();
        const { department } = await getDepartmentByIdUseCase.execute({ id });

        return reply.status(200).send({
          department: departmentToDTO(department),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          if (error.message === 'Department not found') {
            return reply.status(404).send({ message: error.message });
          }
        }
        throw error;
      }
    },
  });
}
