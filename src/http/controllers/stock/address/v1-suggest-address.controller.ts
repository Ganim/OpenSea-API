import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  suggestAddressResponseSchema,
  suggestAddressSchema,
} from '@/http/schemas';
import { makeSuggestAddressUseCase } from '@/use-cases/stock/address/factories/make-suggest-address-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function suggestAddressController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/address/suggest',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.SEARCH,
        resource: 'address',
      }),
    ],
    schema: {
      tags: ['Stock - Address'],
      summary: 'Suggest addresses based on partial input',
      description:
        'Returns address suggestions based on partial address input (autocomplete functionality).',
      body: suggestAddressSchema,
      response: {
        200: suggestAddressResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { partial, limit } = request.body;

      const suggestAddressUseCase = makeSuggestAddressUseCase();
      const result = await suggestAddressUseCase.execute({
        tenantId,
        partial,
        limit,
      });

      return reply.status(200).send(result);
    },
  });
}
