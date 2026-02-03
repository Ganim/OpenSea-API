import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { validateAddressResponseSchema } from '@/http/schemas';
import { makeValidateAddressUseCase } from '@/use-cases/stock/address/factories/make-validate-address-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function validateAddressController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/address/validate/:address',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.READ,
        resource: 'address',
      }),
    ],
    schema: {
      tags: ['Stock - Address'],
      summary: 'Validate if an address exists',
      description:
        'Validates if a bin address exists in the system and returns the bin ID if found.',
      params: z.object({
        address: z.string().min(1).max(50),
      }),
      response: {
        200: validateAddressResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { address } = request.params;

      const validateAddressUseCase = makeValidateAddressUseCase();
      const result = await validateAddressUseCase.execute({
        tenantId,
        address,
      });

      return reply.status(200).send(result);
    },
  });
}
