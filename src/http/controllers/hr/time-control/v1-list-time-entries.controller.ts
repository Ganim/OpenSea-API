import { verifyJwt } from '@/http/middlewares/verify-jwt';
import {
  listTimeEntriesQuerySchema,
  timeEntryResponseSchema,
} from '@/http/schemas';
import { timeEntryToDTO } from '@/mappers/hr/time-entry/time-entry-to-dto';
import { makeListTimeEntriesUseCase } from '@/use-cases/hr/time-control/factories/make-list-time-entries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listTimeEntriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/time-control/entries',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Time Control'],
      summary: 'List time entries',
      description: 'Lists time entries with optional filters',
      querystring: listTimeEntriesQuerySchema,
      response: {
        200: z.object({
          timeEntries: z.array(timeEntryResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const query = request.query;

      const listTimeEntriesUseCase = makeListTimeEntriesUseCase();
      const result = await listTimeEntriesUseCase.execute(query);

      return reply.status(200).send({
        timeEntries: result.timeEntries.map(timeEntryToDTO),
        total: result.total,
        page: query.page ?? 1,
        perPage: query.perPage ?? 50,
        totalPages: Math.ceil(result.total / (query.perPage ?? 50)),
      });
    },
  });
}
