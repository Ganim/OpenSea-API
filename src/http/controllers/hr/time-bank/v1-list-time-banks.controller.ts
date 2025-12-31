import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  listTimeBanksQuerySchema,
  timeBankResponseSchema,
} from '@/http/schemas';
import { timeBankToDTO } from '@/mappers/hr/time-bank/time-bank-to-dto';
import { makeListTimeBanksUseCase } from '@/use-cases/hr/time-bank/factories/make-list-time-banks-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listTimeBanksController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/time-bank',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Time Bank'],
      summary: 'List time banks',
      description: 'Lists all time bank records with optional filters',
      querystring: listTimeBanksQuerySchema,
      response: {
        200: z.object({
          timeBanks: z.array(timeBankResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const query = request.query;

      const listTimeBanksUseCase = makeListTimeBanksUseCase();
      const { timeBanks } = await listTimeBanksUseCase.execute(query);

      return reply.status(200).send({
        timeBanks: timeBanks.map(timeBankToDTO),
      });
    },
  });
}
