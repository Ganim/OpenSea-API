import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { checkCpfSchema } from '@/http/schemas';
import { makeCheckEmployeeCpfUseCase } from '@/use-cases/hr/employees/factories/make-check-employee-cpf-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function checkCpfController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/check-cpf',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Check if CPF exists',
      description: 'Checks whether a CPF is already registered for an employee',
      body: checkCpfSchema,
      response: {
        200: z.object({
          exists: z.boolean(),
          employeeId: z.string().nullable(),
          isDeleted: z.boolean(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { cpf, includeDeleted } = request.body;
      const tenantId = request.user.tenantId!;
      const checkCpfUseCase = makeCheckEmployeeCpfUseCase();

      const result = await checkCpfUseCase.execute({
        tenantId,
        cpf,
        includeDeleted,
      });

      return reply.status(200).send(result);
    },
  });
}
