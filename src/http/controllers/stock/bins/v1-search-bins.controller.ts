import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  searchBinsQuerySchema,
  binListResponseSchema,
} from '@/http/schemas/stock/bins/bin.schema';
import { binToDTO } from '@/mappers/stock/bin/bin-to-dto';
import { makeSearchBinsUseCase } from '@/use-cases/stock/bins/factories/make-search-bins-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function searchBinsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bins/search',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.LIST,
        resource: 'bins',
      }),
    ],
    schema: {
      tags: ['Stock - Bins'],
      summary: 'Search bins by address',
      description:
        'Pesquisa bins pelo endereco com funcionalidade de busca textual parcial (autocomplete).',
      querystring: searchBinsQuerySchema,
      response: {
        200: binListResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { q, limit } = request.query;

      const searchBinsUseCase = makeSearchBinsUseCase();
      const { bins } = await searchBinsUseCase.execute({ query: q, limit });

      return reply.status(200).send({
        bins: bins.map((b) => binToDTO(b)),
      });
    },
  });
}
