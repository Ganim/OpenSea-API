import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  absenceResponseSchema,
  absenceStatusSchema,
  absenceTypeSchema,
} from '@/http/schemas/hr/leave/absence.schema';
import { absenceToDTO } from '@/mappers/hr/absence/absence-to-dto';
import { makeListAbsencesUseCase } from '@/use-cases/hr/absences/factories/make-list-absences-use-case';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listMyAbsencesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/absences',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'List my absences (vacations, sick leaves, etc.)',
      description:
        'Lista as ausencias (ferias, licencas medicas, etc.) do funcionario vinculado ao usuario autenticado, com filtros por tipo, status e periodo.',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        type: absenceTypeSchema.optional(),
        status: absenceStatusSchema.optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
      response: {
        200: z.object({
          absences: z.array(absenceResponseSchema),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { type, status, startDate, endDate } = request.query;

      try {
        // First get my employee record
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee } = await getMyEmployeeUseCase.execute({ userId });

        // Then list my absences
        const listAbsencesUseCase = makeListAbsencesUseCase();
        const { absences } = await listAbsencesUseCase.execute({
          employeeId: employee.id.toString(),
          type,
          status,
          startDate,
          endDate,
        });

        return reply.status(200).send({
          absences: absences.map(absenceToDTO),
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
