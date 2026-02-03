import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listVacationPeriodsQuerySchema,
  paginationMetaSchema,
  vacationPeriodResponseSchema,
} from '@/http/schemas';
import { vacationPeriodToDTO } from '@/mappers/hr/vacation-period/vacation-period-to-dto';
import { makeListVacationPeriodsUseCase } from '@/use-cases/hr/vacation-periods/factories/make-list-vacation-periods-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listVacationPeriodsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/vacation-periods',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'List vacation periods',
      description: 'Retrieves a list of vacation periods with optional filters',
      querystring: listVacationPeriodsQuerySchema,
      response: {
        200: z.object({
          vacationPeriods: z.array(vacationPeriodResponseSchema),
          meta: paginationMetaSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId, status, year, page, perPage } = request.query;

      const listVacationPeriodsUseCase = makeListVacationPeriodsUseCase();
      const { vacationPeriods } = await listVacationPeriodsUseCase.execute({
        tenantId,
        employeeId,
        status,
        year,
      });

      // Simple pagination
      const total = vacationPeriods.length;
      const start = (page - 1) * perPage;
      const paginatedPeriods = vacationPeriods.slice(start, start + perPage);

      return reply.status(200).send({
        vacationPeriods: paginatedPeriods.map(vacationPeriodToDTO),
        meta: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      });
    },
  });
}
