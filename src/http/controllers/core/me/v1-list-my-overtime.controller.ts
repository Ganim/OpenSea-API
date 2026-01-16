import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { overtimeResponseSchema } from '@/http/schemas/hr/time-management/overtime.schema';
import { overtimeToDTO } from '@/mappers/hr/overtime/overtime-to-dto';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeListOvertimeUseCase } from '@/use-cases/hr/overtime/factories/make-list-overtime-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listMyOvertimeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/overtime',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'List my overtime requests',
      querystring: z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        approved: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          overtimes: z.array(overtimeResponseSchema),
          total: z.number(),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { startDate, endDate, approved } = request.query;

      try {
        // First get my employee record
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee } = await getMyEmployeeUseCase.execute({ userId });

        // Then list my overtime
        const listOvertimeUseCase = makeListOvertimeUseCase();
        const { overtimes, total } = await listOvertimeUseCase.execute({
          employeeId: employee.id.toString(),
          startDate,
          endDate,
          approved,
        });

        return reply.status(200).send({
          overtimes: overtimes.map(overtimeToDTO),
          total,
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
