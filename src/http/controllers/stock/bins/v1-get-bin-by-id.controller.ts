import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { binResponseSchema } from '@/http/schemas/stock/bins/bin.schema';
import { binToDTO } from '@/mappers/stock/bin/bin-to-dto';
import { makeGetBinByIdUseCase } from '@/use-cases/stock/bins/factories/make-get-bin-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBinByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bins/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.WAREHOUSES.ACCESS,
        resource: 'bins',
      }),
    ],
    schema: {
      tags: ['Stock - Bins'],
      summary: 'Get a bin by ID',
      description:
        'Retorna os dados de um bin especifico pelo seu identificador unico, incluindo contagem de itens alocados.',
      params: z.object({
        id: z.string().uuid(),
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
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const getBinByIdUseCase = makeGetBinByIdUseCase();
      const { bin, itemCount } = await getBinByIdUseCase.execute({
        tenantId,
        id,
      });

      return reply.status(200).send({
        bin: binToDTO(bin, { itemCount }),
      });
    },
  });
}
