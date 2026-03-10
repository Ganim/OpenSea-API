import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  absenceResponseSchema,
  listAbsencesQuerySchema,
  paginationMetaSchema,
} from '@/http/schemas';
import { absenceToDTO } from '@/mappers/hr/absence/absence-to-dto';
import { makeListAbsencesUseCase } from '@/use-cases/hr/absences/factories/make-list-absences-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listAbsencesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/absences',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Absences'],
      summary: 'List absences',
      description:
        'Retrieves a list of absences with optional filters for employee, type, status, and date range',
      querystring: listAbsencesQuerySchema,
      response: {
        200: z.object({
          absences: z.array(absenceResponseSchema),
          meta: paginationMetaSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId, type, status, startDate, endDate, page, perPage } =
        request.query;

      const listAbsencesUseCase = makeListAbsencesUseCase();
      const { absences, meta } = await listAbsencesUseCase.execute({
        tenantId,
        employeeId,
        type,
        status,
        startDate,
        endDate,
        page,
        perPage,
      });

      return reply.status(200).send({
        absences: absences.map(absenceToDTO),
        meta,
      });
    },
  });
}
