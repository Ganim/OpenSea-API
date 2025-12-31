import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  deductionResponseSchema,
  listDeductionsQuerySchema,
} from '@/http/schemas';
import { deductionToDTO } from '@/mappers/hr/deduction';
import { makeListDeductionsUseCase } from '@/use-cases/hr/deductions/factories/make-list-deductions-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listDeductionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/deductions',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Deduction'],
      summary: 'List deductions',
      description: 'Lists all deductions with optional filters',
      querystring: listDeductionsQuerySchema,
      response: {
        200: z.object({
          deductions: z.array(deductionResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const filters = request.query;

      const listDeductionsUseCase = makeListDeductionsUseCase();
      const { deductions } = await listDeductionsUseCase.execute(filters);

      return reply.status(200).send({
        deductions: deductions.map(deductionToDTO),
      });
    },
  });
}
