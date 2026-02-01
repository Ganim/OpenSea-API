import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { binResponseSchema } from '@/http/schemas/stock/bins/bin.schema';
import { binToDTO } from '@/mappers/stock/bin/bin-to-dto';
import { makeGetBinByAddressUseCase } from '@/use-cases/stock/bins/factories/make-get-bin-by-address-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBinByAddressController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bins/address/:address',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.READ,
        resource: 'bins',
      }),
    ],
    schema: {
      tags: ['Stock - Bins'],
      summary: 'Get a bin by address (e.g., FAB-EST-102-B)',
      description:
        'Busca um bin pelo seu endereco formatado (ex: FAB-EST-102-B). Retorna os dados do bin com contagem de itens.',
      params: z.object({
        address: z.string().min(1),
      }),
      response: {
        200: z.object({
          bin: binResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { address } = request.params;

      try {
        const getBinByAddressUseCase = makeGetBinByAddressUseCase();
        const { bin, itemCount } = await getBinByAddressUseCase.execute({
          address,
        });

        return reply.status(200).send({
          bin: binToDTO(bin, { itemCount }),
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
