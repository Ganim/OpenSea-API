import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { parseAddressResponseSchema } from '@/http/schemas';
import { makeParseAddressUseCase } from '@/use-cases/stock/address/factories/make-parse-address-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function parseAddressController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/address/parse/:address',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.READ,
        resource: 'address',
      }),
    ],
    schema: {
      tags: ['Stock - Address'],
      summary: 'Parse an address into components',
      description:
        'Parses a bin address (e.g., FAB-EST-102-B) into its components (warehouse, zone, aisle, shelf, bin).',
      params: z.object({
        address: z.string().min(1).max(50),
      }),
      response: {
        200: parseAddressResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { address } = request.params;

      const parseAddressUseCase = makeParseAddressUseCase();
      const result = await parseAddressUseCase.execute({ address });

      return reply.status(200).send(result);
    },
  });
}
