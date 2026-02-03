import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { binDetailResponseSchema } from '@/http/schemas/stock/bins/bin.schema';
import { binToDTO } from '@/mappers/stock/bin/bin-to-dto';
import { makeGetBinDetailUseCase } from '@/use-cases/stock/bins/factories/make-get-bin-detail-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBinDetailController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bins/:id/detail',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.READ,
        resource: 'bins',
      }),
    ],
    schema: {
      tags: ['Stock - Bins'],
      summary:
        'Get detailed bin information including items, zone and warehouse',
      description:
        'Retorna informacoes detalhadas de um bin, incluindo itens armazenados, zona e armazem associados.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: binDetailResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const getBinDetailUseCase = makeGetBinDetailUseCase();
        const { bin, itemCount, items, zone, warehouse } =
          await getBinDetailUseCase.execute({ tenantId, id });

        return reply.status(200).send({
          bin: binToDTO(bin, { itemCount }),
          items,
          zone,
          warehouse,
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
