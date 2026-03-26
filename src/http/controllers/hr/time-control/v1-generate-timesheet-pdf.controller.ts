import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { makeGenerateTimesheetPDFUseCase } from '@/use-cases/hr/time-control/factories/make-generate-timesheet-pdf-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GenerateTimesheetPDFController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/time-control/timesheet/:employeeId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Time Control'],
      summary: 'Generate timesheet PDF (espelho de ponto)',
      description:
        'Generates a monthly timesheet (espelho de ponto) PDF for an employee, showing all daily punches, worked hours, extra hours, absences, and totals.',
      params: z.object({
        employeeId: idSchema,
      }),
      querystring: z.object({
        month: z.coerce.number().int().min(1).max(12),
        year: z.coerce.number().int().min(2000).max(2100),
        companyName: z.string().optional(),
        companyCnpj: z.string().optional(),
        dailyExpectedMinutes: z.coerce.number().int().min(1).optional(),
      }),
      response: {
        200: z.any(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId } = request.params;
      const { month, year, companyName, companyCnpj, dailyExpectedMinutes } =
        request.query;

      try {
        const useCase = makeGenerateTimesheetPDFUseCase();
        const { buffer, filename } = await useCase.execute({
          tenantId,
          employeeId,
          month,
          year,
          companyName,
          companyCnpj,
          dailyExpectedMinutes,
        });

        return reply
          .status(200)
          .header('Content-Type', 'application/pdf')
          .header('Content-Disposition', `attachment; filename="${filename}"`)
          .send(buffer);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
