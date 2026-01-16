import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  listBinsQuerySchema,
  binListResponseSchema,
} from '@/http/schemas/stock/bins/bin.schema';
import { binToDTO } from '@/mappers/stock/bin/bin-to-dto';
import { makeListBinsUseCase } from '@/use-cases/stock/bins/factories/make-list-bins-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function listBinsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bins',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.LIST,
        resource: 'bins',
      }),
    ],
    schema: {
      tags: ['Stock - Bins'],
      summary: 'List bins with filters',
      querystring: listBinsQuerySchema,
      response: {
        200: binListResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const filters = request.query;

      const listBinsUseCase = makeListBinsUseCase();
      const { bins } = await listBinsUseCase.execute(filters);

      return reply.status(200).send({
        bins: bins.map((b) => binToDTO(b)),
      });
    },
  });
}
