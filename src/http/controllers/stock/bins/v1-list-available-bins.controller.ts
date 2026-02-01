import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { binListResponseSchema } from '@/http/schemas/stock/bins/bin.schema';
import { binToDTO } from '@/mappers/stock/bin/bin-to-dto';
import { makeListAvailableBinsUseCase } from '@/use-cases/stock/bins/factories/make-list-available-bins-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listAvailableBinsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bins/available',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.LIST,
        resource: 'bins',
      }),
    ],
    schema: {
      tags: ['Stock - Bins'],
      summary: 'List available bins (not full, not blocked)',
      description:
        'Lista os bins disponiveis (nao lotados e nao bloqueados) de uma zona especifica para alocacao de itens.',
      querystring: z.object({
        zoneId: z.string().uuid(),
      }),
      response: {
        200: binListResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { zoneId } = request.query;

      try {
        const listAvailableBinsUseCase = makeListAvailableBinsUseCase();
        const { bins } = await listAvailableBinsUseCase.execute({ zoneId });

        return reply.status(200).send({
          bins: bins.map((b) => binToDTO(b)),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
