import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeResponseSchema } from '@/http/schemas/hr/employees/employee.schema';
import { employeeToDTO } from '@/mappers/hr/employee/employee-to-dto';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
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
        const useCase = makeGetMyEmployeeUseCase();
        const { employee } = await useCase.execute({ tenantId, userId });

        return reply.status(200).send({ employee: employeeToDTO(employee) });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
