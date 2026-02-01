import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { absenceResponseSchema } from '@/http/schemas/hr/leave/absence.schema';
import { absenceToDTO } from '@/mappers/hr/absence/absence-to-dto';
import { makeRequestVacationUseCase } from '@/use-cases/hr/absences/factories/make-request-vacation-use-case';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function requestMyVacationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/me/vacations',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'Request vacation for myself',
      description:
        'Registra uma solicitacao de ferias para o funcionario vinculado ao usuario autenticado. Requer um periodo de ferias valido.',
      security: [{ bearerAuth: [] }],
      body: z.object({
        vacationPeriodId: z.string().uuid(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        reason: z.string().max(500).optional(),
      }),
      response: {
        201: z.object({ absence: absenceResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { vacationPeriodId, startDate, endDate, reason } = request.body;

      try {
        // First get my employee record
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee } = await getMyEmployeeUseCase.execute({ userId });

        // Then request vacation
        const requestVacationUseCase = makeRequestVacationUseCase();
        const { absence } = await requestVacationUseCase.execute({
          employeeId: employee.id.toString(),
          vacationPeriodId,
          startDate,
          endDate,
          reason,
          requestedBy: userId,
        });

        return reply.status(201).send({ absence: absenceToDTO(absence) });
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
