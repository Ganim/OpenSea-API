import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  getTimeBankQuerySchema,
  timeBankResponseSchema,
} from '@/http/schemas/hr/time-management/time-bank.schema';
import { timeBankToDTO } from '@/mappers/hr/time-bank/time-bank-to-dto';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeGetTimeBankUseCase } from '@/use-cases/hr/time-bank/factories/make-get-time-bank-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getMyTimeBankController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/time-bank',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'Get my time bank balance',
      description:
        'Retorna o saldo do banco de horas do funcionario vinculado ao usuario autenticado, com filtro por ano.',
      security: [{ bearerAuth: [] }],
      querystring: getTimeBankQuerySchema,
      response: {
        200: z.object({ timeBank: timeBankResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { year } = request.query;

      try {
        // First get my employee record
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee } = await getMyEmployeeUseCase.execute({ userId });

        // Then get my time bank
        const getTimeBankUseCase = makeGetTimeBankUseCase();
        const { timeBank } = await getTimeBankUseCase.execute({
          employeeId: employee.id.toString(),
          year,
        });

        return reply.status(200).send({ timeBank: timeBankToDTO(timeBank) });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
