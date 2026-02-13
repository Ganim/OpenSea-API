import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeResponseSchema } from '@/http/schemas/hr/employees/employee.schema';
import { employeeToDTOWithRelations } from '@/mappers/hr/employee/employee-to-dto';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getMyEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/employee',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Me'],
      summary: 'Get my employee data',
      description:
        'Retorna os dados do registro de funcionario vinculado ao usuario autenticado.',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ employee: employeeResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const employeesRepository = new PrismaEmployeesRepository();
        // First find the employee by userId to get the ID
        const employee = await employeesRepository.findByUserId(
          new UniqueEntityID(userId),
          tenantId,
        );

        if (!employee) {
          return reply
            .status(404)
            .send({ message: 'No employee record found for this user.' });
        }

        // Now fetch with relations
        const result = await employeesRepository.findByIdWithRelations(
          employee.id,
          tenantId,
        );

        if (!result) {
          return reply
            .status(404)
            .send({ message: 'No employee record found for this user.' });
        }

        return reply.status(200).send({
          employee: employeeToDTOWithRelations(
            result.employee,
            result.rawRelations,
          ),
        });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
