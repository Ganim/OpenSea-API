import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listSalaryHistoryResponseSchema,
  salaryHistoryParamsSchema,
} from '@/http/schemas/hr/salary-history';
import { salaryHistoryToDTO } from '@/mappers/hr/salary-history';
import { makeListSalaryHistoryUseCase } from '@/use-cases/hr/salary-history/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListSalaryHistoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees/:id/salary-history',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SALARY.ACCESS,
        resource: 'salary-history',
      }),
    ],
    schema: {
      tags: ['HR - Salary History'],
      summary: 'Lista o histórico salarial de um funcionário',
      description:
        'Retorna a timeline de mudanças salariais do funcionário em ordem decrescente por data de vigência.',
      params: salaryHistoryParamsSchema,
      response: {
        200: listSalaryHistoryResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const listSalaryHistoryUseCase = makeListSalaryHistoryUseCase();
        const { history } = await listSalaryHistoryUseCase.execute({
          tenantId,
          employeeId: id,
        });

        return reply.status(200).send({
          history: history.map((record) => salaryHistoryToDTO(record)),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
