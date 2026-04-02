import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeScheduleVacationSplitUseCase } from '@/use-cases/hr/vacation-periods/factories/make-schedule-vacation-split-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const vacationSplitResponseSchema = z.object({
  id: z.string().uuid(),
  vacationPeriodId: z.string().uuid(),
  splitNumber: z.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  days: z.number(),
  status: z.string(),
  paymentDate: z.coerce.date().nullable().optional(),
  paymentAmount: z.number().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export async function v1ScheduleVacationSplitController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/vacation-periods/:vacationPeriodId/splits',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.VACATIONS.REGISTER,
        resource: 'vacations',
      }),
    ],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'Schedule a vacation split',
      description:
        'Schedules a split (parcela) for a vacation period. Max 3 splits per period.',
      params: z.object({
        vacationPeriodId: z.string().uuid(),
      }),
      body: z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        days: z.number().int().positive(),
      }),
      response: {
        201: z.object({ vacationSplit: vacationSplitResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { vacationPeriodId } = request.params;
      const { startDate, endDate, days } = request.body;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeScheduleVacationSplitUseCase();
        const { vacationSplit } = await useCase.execute({
          tenantId,
          vacationPeriodId,
          startDate,
          endDate,
          days,
        });

        return reply.status(201).send({
          vacationSplit: {
            id: vacationSplit.id.toString(),
            vacationPeriodId: vacationSplit.vacationPeriodId.toString(),
            splitNumber: vacationSplit.splitNumber,
            startDate: vacationSplit.startDate,
            endDate: vacationSplit.endDate,
            days: vacationSplit.days,
            status: vacationSplit.status,
            paymentDate: vacationSplit.paymentDate ?? null,
            paymentAmount: vacationSplit.paymentAmount ?? null,
            createdAt: vacationSplit.createdAt,
            updatedAt: vacationSplit.updatedAt,
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
