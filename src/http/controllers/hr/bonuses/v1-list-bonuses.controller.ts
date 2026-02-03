import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bonusResponseSchema, listBonusesQuerySchema } from '@/http/schemas';
import { bonusToDTO } from '@/mappers/hr/bonus';
import { makeListBonusesUseCase } from '@/use-cases/hr/bonuses/factories/make-list-bonuses-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBonusesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/bonuses',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Bonus'],
      summary: 'List bonuses',
      description: 'Lists all bonuses with optional filters',
      querystring: listBonusesQuerySchema,
      response: {
        200: z.object({
          bonuses: z.array(bonusResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const listBonusesUseCase = makeListBonusesUseCase();
      const { bonuses } = await listBonusesUseCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        bonuses: bonuses.map(bonusToDTO),
      });
    },
  });
}
