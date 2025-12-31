import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { listPayrollsQuerySchema, payrollResponseSchema } from '@/http/schemas';
import { payrollToDTO } from '@/mappers/hr/payroll';
import { makeListPayrollsUseCase } from '@/use-cases/hr/payrolls/factories/make-list-payrolls-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPayrollsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/payrolls',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Payroll'],
      summary: 'List payrolls',
      description: 'Lists all payrolls with optional filters',
      querystring: listPayrollsQuerySchema,
      response: {
        200: z.object({
          payrolls: z.array(payrollResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const filters = request.query;

      const listPayrollsUseCase = makeListPayrollsUseCase();
      const { payrolls } = await listPayrollsUseCase.execute(filters);

      return reply.status(200).send({
        payrolls: payrolls.map(payrollToDTO),
      });
    },
  });
}
