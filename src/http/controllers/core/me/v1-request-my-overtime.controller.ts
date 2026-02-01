import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { overtimeResponseSchema } from '@/http/schemas/hr/time-management/overtime.schema';
import { overtimeToDTO } from '@/mappers/hr/overtime/overtime-to-dto';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeRequestOvertimeUseCase } from '@/use-cases/hr/overtime/factories/make-request-overtime-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function requestMyOvertimeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/me/overtime',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'Request overtime for myself',
      description:
        'Registra uma solicitacao de hora extra para o funcionario vinculado ao usuario autenticado. Requer vinculo com registro de funcionario.',
      security: [{ bearerAuth: [] }],
      body: z.object({
        date: z.coerce.date(),
        hours: z.number().positive().max(12),
        reason: z.string().min(10).max(500),
      }),
      response: {
        201: z.object({ overtime: overtimeResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { date, hours, reason } = request.body;

      try {
        // First get my employee record
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee } = await getMyEmployeeUseCase.execute({ userId });

        // Then request overtime
        const requestOvertimeUseCase = makeRequestOvertimeUseCase();
        const { overtime } = await requestOvertimeUseCase.execute({
          employeeId: employee.id.toString(),
          date,
          hours,
          reason,
        });

        return reply.status(201).send({ overtime: overtimeToDTO(overtime) });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        if (err instanceof Error) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
