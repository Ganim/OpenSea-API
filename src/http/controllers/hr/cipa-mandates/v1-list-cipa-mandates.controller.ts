import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cipaMandateResponseSchema,
  listCipaMandatesQuerySchema,
} from '@/http/schemas';
import { cipaMandateToDTO } from '@/mappers/hr/cipa-mandate';
import { makeListCipaMandatesUseCase } from '@/use-cases/hr/cipa-mandates/factories/make-list-cipa-mandates-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListCipaMandatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/cipa-mandates',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - CIPA'],
      summary: 'List CIPA mandates',
      description: 'Lists all CIPA mandates with optional filters',
      querystring: listCipaMandatesQuerySchema,
      response: {
        200: z.object({
          cipaMandates: z.array(cipaMandateResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListCipaMandatesUseCase();
      const { cipaMandates } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        cipaMandates: cipaMandates.map(cipaMandateToDTO),
      });
    },
  });
}
